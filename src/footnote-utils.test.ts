import { describe, it, expect } from "vitest";
import { renumberFootnotes } from "./footnote-utils";

describe("renumberFootnotes", () => {
	describe("basic functionality", () => {
		it("should handle empty content", () => {
			const result = renumberFootnotes("");
			expect(result).toEqual({
				content: "",
				changed: false,
				footnoteCount: 0,
			});
		});

		it("should handle null/undefined content", () => {
			const result1 = renumberFootnotes(null as any);
			const result2 = renumberFootnotes(undefined as any);

			expect(result1).toEqual({
				content: "",
				changed: false,
				footnoteCount: 0,
			});
			expect(result2).toEqual({
				content: "",
				changed: false,
				footnoteCount: 0,
			});
		});

		it("should handle content without footnotes", () => {
			const content = "This is just regular text without any footnotes.";
			const result = renumberFootnotes(content);

			expect(result).toEqual({
				content,
				changed: false,
				footnoteCount: 0,
			});
		});
	});

	describe("single footnote", () => {
		it("should renumber single footnote to 1", () => {
			const content =
				"This has a footnote[^abc] in it.\n\n[^abc]: Footnote content";
			const result = renumberFootnotes(content);

			expect(result.content).toBe(
				"This has a footnote[^1] in it.\n\n[^1]: Footnote content"
			);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(1);
		});

		it("should handle footnote with numeric label", () => {
			const content =
				"This has a footnote[^123] in it.\n\n[^123]: Footnote content";
			const result = renumberFootnotes(content);

			expect(result.content).toBe(
				"This has a footnote[^1] in it.\n\n[^1]: Footnote content"
			);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(1);
		});

		it("should handle footnote with special characters in label", () => {
			const content =
				"This has a footnote[^note-1.2] in it.\n\n[^note-1.2]: Footnote content";
			const result = renumberFootnotes(content);

			expect(result.content).toBe(
				"This has a footnote[^1] in it.\n\n[^1]: Footnote content"
			);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(1);
		});
	});

	describe("multiple footnotes", () => {
		it("should renumber multiple footnotes based on order of appearance", () => {
			const content = `This text has[^xyz] some content[^note] and more[^abc] footnotes.

[^note]: Second footnote content
[^abc]: Third footnote content  
[^xyz]: First footnote content`;

			const result = renumberFootnotes(content);

			// Footnotes should be renumbered AND sorted by appearance order: xyz=1, note=2, abc=3
			const expected = `This text has[^1] some content[^2] and more[^3] footnotes.

[^1]: First footnote content
[^2]: Second footnote content
[^3]: Third footnote content  `;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(3);
		});

		it("should handle duplicate footnote references", () => {
			const content = `This text has[^xyz] some content[^note] and more[^xyz] references.

[^note]: Second footnote content
[^xyz]: First footnote content (referenced twice)`;

			const result = renumberFootnotes(content);

			// Footnotes sorted by appearance order: xyz=1, note=2
			const expected = `This text has[^1] some content[^2] and more[^1] references.

[^1]: First footnote content (referenced twice)
[^2]: Second footnote content`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(2);
		});

		it("should maintain sequential numbering regardless of original names", () => {
			const content = `First[^100], second[^2], third[^a], fourth[^zzz].

[^100]: First content
[^2]: Second content
[^a]: Third content
[^zzz]: Fourth content`;

			const result = renumberFootnotes(content);

			const expected = `First[^1], second[^2], third[^3], fourth[^4].

[^1]: First content
[^2]: Second content
[^3]: Third content
[^4]: Fourth content`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(4);
		});
	});

	describe("edge cases", () => {
		it("should handle footnotes without definitions", () => {
			const content = "This has a footnote[^orphan] without definition.";
			const result = renumberFootnotes(content);

			expect(result.content).toBe(
				"This has a footnote[^1] without definition."
			);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(1);
		});

		it("should handle footnote definitions without references", () => {
			const content = `This text has no references.

[^orphan]: This definition has no reference in the text above`;

			const result = renumberFootnotes(content);

			// Should not change anything since there are no references in the text
			expect(result.content).toBe(content);
			expect(result.changed).toBe(false);
			expect(result.footnoteCount).toBe(0);
		});

		it("should handle footnotes with indented definitions", () => {
			const content = `This has footnotes[^a] and[^b].

    [^a]: Indented footnote
        [^b]: More indented footnote`;

			const result = renumberFootnotes(content);

			const expected = `This has footnotes[^1] and[^2].

    [^1]: Indented footnote
        [^2]: More indented footnote`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(2);
		});

		it("should handle mixed line endings", () => {
			const content =
				"Text[^a] with\r\nfootnote[^b].\r\n\r\n[^a]: First\r\n[^b]: Second";
			const result = renumberFootnotes(content);

			// Should preserve \r\n line endings and sort footnotes by appearance order: a=1, b=2
			const expected =
				"Text[^1] with\r\nfootnote[^2].\r\n\r\n[^1]: First\r\n[^2]: Second";

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(2);
		});
	});

	describe("already numbered footnotes", () => {
		it("should not change already correctly numbered footnotes", () => {
			const content = `This has footnotes[^1] and[^2] and[^3].

[^1]: First footnote
[^2]: Second footnote
[^3]: Third footnote`;

			const result = renumberFootnotes(content);

			expect(result.content).toBe(content);
			expect(result.changed).toBe(false);
			expect(result.footnoteCount).toBe(3);
		});

		it("should renumber incorrectly ordered numeric footnotes", () => {
			const content = `This has footnotes[^3] and[^1] and[^2].

[^3]: Should become first
[^1]: Should become second  
[^2]: Should become third`;

			const result = renumberFootnotes(content);

			const expected = `This has footnotes[^1] and[^2] and[^3].

[^1]: Should become first
[^2]: Should become second  
[^3]: Should become third`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(3);
		});
	});

	describe("performance and robustness", () => {
		it("should handle large content efficiently", () => {
			const footnotes = Array.from(
				{ length: 100 },
				(_, i) => `[^note${i}]`
			).join(" ");
			const definitions = Array.from(
				{ length: 100 },
				(_, i) => `[^note${i}]: Content ${i}`
			).join("\n");
			const content = `Large text with many footnotes: ${footnotes}\n\n${definitions}`;

			const start = Date.now();
			const result = renumberFootnotes(content);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(1000); // Should complete within 1 second
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(100);
		});
	});

	describe("real-world scenarios", () => {
		it("should handle academic paper with citations", () => {
			const content = `# The Impact of Machine Learning on Software Development

## Introduction

Machine learning has revolutionized many industries[^ml-survey], and software development is no exception. Recent studies have shown significant improvements in code quality[^code-quality] when ML-assisted tools are used.

## Background

The history of automated code assistance dates back to the 1960s[^history], but modern approaches using deep learning have only emerged in the last decade[^deep-learning]. Companies like GitHub have invested heavily in this space[^github-copilot], leading to tools that can generate entire functions from natural language descriptions.

## Methodology

Our research involved analyzing 1,000 software projects[^dataset] across different programming languages. We measured several metrics including code complexity, bug rates, and development time[^metrics].

### Data Collection

The data was collected over a 12-month period[^collection-period] from open-source repositories. Each project was analyzed using both traditional development methods and ML-assisted approaches[^comparison-method].

## Results

The results showed a 25% improvement in development speed[^speed-results] and a 40% reduction in bug rates[^bug-results]. However, there were some limitations to consider[^limitations].

[^ml-survey]: Smith, J. et al. "Machine Learning in Industry: A Comprehensive Survey." *Journal of Technology* 15, no. 3 (2023): 45-72.
[^code-quality]: Johnson, A. "Measuring Code Quality in the Age of AI." *Software Engineering Quarterly* 8, no. 2 (2023): 12-28.
[^history]: Brown, M. "A History of Programming Tools." *Computing History Review* 12 (2022): 156-203.
[^deep-learning]: Lee, K. "Deep Learning Applications in Software Engineering." *AI in Software Development* 3, no. 1 (2023): 78-95.
[^github-copilot]: Wilson, R. "GitHub Copilot: A Game Changer for Developers." *Tech Innovation Today* 42 (2023): 34-41.
[^dataset]: Our dataset is available at: https://github.com/research/ml-code-analysis
[^metrics]: Metrics included cyclomatic complexity, maintainability index, and lines of code per function.
[^collection-period]: Data collection ran from January 2023 to December 2023.
[^comparison-method]: Thompson, L. "Comparative Analysis Methods in Software Research." *Research Methods in CS* 7, no. 4 (2023): 89-102.
[^speed-results]: Based on average time to complete standardized coding tasks.
[^bug-results]: Measured as bugs per 1000 lines of code in production.
[^limitations]: Limitations include potential bias in tool selection and varying developer skill levels.`;

			const result = renumberFootnotes(content);

			// Check that all footnotes are renumbered sequentially
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(12);

			// Verify the first few footnotes are renumbered correctly
			expect(result.content).toContain(
				"many industries[^1], and software"
			);
			expect(result.content).toContain(
				"code quality[^2] when ML-assisted"
			);
			expect(result.content).toContain(
				"back to the 1960s[^3], but modern"
			);
			expect(result.content).toContain("the last decade[^4]. Companies");

			// Verify definitions are renumbered
			expect(result.content).toContain("[^1]: Smith, J. et al.");
			expect(result.content).toContain("[^2]: Johnson, A.");
			expect(result.content).toContain("[^3]: Brown, M.");
			expect(result.content).toContain("[^4]: Lee, K.");
		});

		it("should handle blog post with scattered footnotes", () => {
			const content = `# Why I Switched from React to Vue

Last month, I made the decision to migrate our entire frontend from React to Vue[^migration]. It wasn't an easy choice, but after months of deliberation, I believe it was the right one.

## The Problems with Our React Setup

Our React codebase had grown organically over three years[^timeline], and we were facing several challenges:

- **Bundle Size**: Our bundle had grown to over 2MB[^bundle-size], which was causing performance issues
- **Developer Experience**: New team members were struggling with our complex Redux setup[^redux-complexity]
- **Maintenance**: We were spending 30% of our time fixing legacy code[^maintenance-time]

## Why Vue?

Vue offered several advantages for our use case[^vue-advantages]:

1. **Simplicity**: The learning curve is much gentler[^learning-curve]
2. **Performance**: Better out-of-the-box performance[^performance-stats]
3. **Ecosystem**: Mature ecosystem with great tooling[^ecosystem]

## The Migration Process

The migration took 4 months[^migration-duration] and involved:

- Planning phase (2 weeks)
- Component migration (3 months)
- Testing and deployment (2 weeks)
- Post-migration cleanup (2 weeks)

### Lessons Learned

The biggest lesson was the importance of incremental migration[^incremental]. We also learned that developer buy-in is crucial[^team-buy-in].

## Conclusion

While the migration was challenging, our team is now more productive[^productivity-gains] and our users are experiencing better performance[^user-metrics].

[^migration]: The migration process is documented in our internal wiki.
[^timeline]: Our React app was first deployed in January 2021.
[^bundle-size]: Measured using webpack-bundle-analyzer.
[^redux-complexity]: We had 47 reducers and 120 actions across the application.
[^maintenance-time]: Based on time tracking data from Jira over 6 months.
[^vue-advantages]: Comparison based on Vue 3 vs React 18 features.
[^learning-curve]: Based on survey of 5 junior developers joining the team.
[^performance-stats]: Lighthouse scores improved from 72 to 94.
[^ecosystem]: Includes Vue Router, Vuex, and Vue CLI.
[^migration-duration]: From October 2023 to February 2024.
[^incremental]: We used the strangler fig pattern for gradual replacement.
[^team-buy-in]: Regular team meetings and training sessions were essential.
[^productivity-gains]: 40% fewer bugs and 25% faster feature development.
[^user-metrics]: Page load times decreased by 35% on average.`;

			const result = renumberFootnotes(content);

			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(13);

			// Check that footnotes maintain their connection to content
			expect(result.content).toContain("React to Vue[^1]. It wasn't");
			expect(result.content).toContain("three years[^2], and we");
			expect(result.content).toContain("over 2MB[^3], which was");

			// Verify definitions are properly renumbered
			expect(result.content).toContain(
				"[^1]: The migration process is documented"
			);
			expect(result.content).toContain(
				"[^2]: Our React app was first deployed"
			);
			expect(result.content).toContain(
				"[^3]: Measured using webpack-bundle-analyzer"
			);
		});

		it("should handle document with mixed content and footnotes", () => {
			const content = `# Climate Change and Technology Solutions

## Executive Summary

Climate change represents one of the most pressing challenges of our time[^ipcc-report]. This report examines how emerging technologies can contribute to mitigation and adaptation efforts[^tech-solutions].

## Key Findings

| Technology | CO2 Reduction Potential | Implementation Cost |
|------------|-------------------------|-------------------|
| Solar Power | 45% by 2030[^solar-stats] | $2.5 trillion[^cost-solar] |
| Wind Power | 30% by 2030[^wind-stats] | $1.8 trillion[^cost-wind] |
| Carbon Capture | 15% by 2030[^cc-stats] | $4.2 trillion[^cost-cc] |

### Regional Analysis

Different regions face unique challenges:

- **North America**: Focus on renewable energy transition[^na-strategy]
- **Europe**: Emphasis on energy efficiency[^eu-strategy]  
- **Asia**: Rapid industrialization requires careful planning[^asia-strategy]

## Recommendations

1. Increase investment in renewable energy infrastructure[^investment-needs]
2. Develop carbon pricing mechanisms[^carbon-pricing]
3. Support research into breakthrough technologies[^research-funding]

> "The next decade will be crucial for determining our climate future."[^climate-expert]

## Conclusion

Technology alone cannot solve climate change[^tech-limitations], but it will play a vital role in our response. Coordinated global action is essential[^global-cooperation].

[^ipcc-report]: IPCC. "Climate Change 2023: Synthesis Report." Intergovernmental Panel on Climate Change, 2023.
[^tech-solutions]: Based on analysis of 200+ climate technologies across 15 sectors.
[^solar-stats]: International Energy Agency. "Solar Power Outlook 2023." IEA Publications, 2023.
[^cost-solar]: McKinsey Global Institute. "The Economics of Solar Energy." McKinsey & Company, 2023.
[^wind-stats]: Global Wind Energy Council. "Global Wind Report 2023." GWEC, 2023.
[^cost-wind]: Bloomberg New Energy Finance. "Wind Energy Investment Outlook." BNEF, 2023.
[^cc-stats]: Carbon Capture Coalition. "State of Carbon Capture 2023." CCC Report, 2023.
[^cost-cc]: MIT Energy Initiative. "The Cost of Carbon Capture Technology." MIT Press, 2023.
[^na-strategy]: North American Climate Strategy Council. "Regional Climate Action Plan." NACSC, 2023.
[^eu-strategy]: European Commission. "Green Deal Implementation Status." EC Publications, 2023.
[^asia-strategy]: Asian Development Bank. "Climate Change in Asia: Challenges and Opportunities." ADB, 2023.
[^investment-needs]: World Bank. "Climate Investment Requirements 2023-2030." World Bank Group, 2023.
[^carbon-pricing]: Carbon Pricing Leadership Coalition. "State of Carbon Pricing 2023." CPLC, 2023.
[^research-funding]: OECD. "Climate Research and Development Funding." OECD Publications, 2023.
[^climate-expert]: Dr. Sarah Chen, Director of Climate Policy Institute, interviewed March 2024.
[^tech-limitations]: Technology Policy Institute. "Limits of Technological Solutions to Climate Change." TPI, 2023.
[^global-cooperation]: United Nations. "Framework Convention on Climate Change: Progress Report." UN, 2023.`;

			const result = renumberFootnotes(content);

			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(17);

			// Verify footnotes in different contexts (table, list, quote) are handled
			expect(result.content).toContain("of our time[^1]. This report");
			expect(result.content).toContain("45% by 2030[^3]");
			expect(result.content).toContain("$2.5 trillion[^4]");
			expect(result.content).toContain('climate future."[^15]');

			// Check that complex formatting is preserved
			expect(result.content).toContain(
				"| Solar Power | 45% by 2030[^3] | $2.5 trillion[^4] |"
			);
			expect(result.content).toContain(
				'> "The next decade will be crucial for determining our climate future."[^15]'
			);
		});

		it("should handle document with footnotes in lists and quotes", () => {
			const content = `# Best Practices for Remote Work

Working remotely has become the norm for many professionals[^remote-stats]. Here are the key strategies we've learned:

## Communication

Effective communication is the foundation of remote work success[^communication-study]. Consider these approaches:

1. **Daily standups**: Keep them short and focused[^standup-guide]
2. **Async communication**: Use tools like Slack effectively[^async-tools]
3. **Video calls**: Reserve for complex discussions[^video-guidelines]

## Productivity

> "The key to remote productivity is creating boundaries between work and personal life."[^productivity-expert]

### Time Management

- Use time-blocking techniques[^time-blocking]
- Take regular breaks[^break-research]
- Set clear work hours[^boundary-setting]

### Workspace Setup

Your physical environment matters[^workspace-study]:

- Dedicated workspace[^dedicated-space]
- Proper lighting[^lighting-importance]
- Ergonomic furniture[^ergonomics]

## Team Building

Remote teams need intentional relationship building[^team-building]:

- Virtual coffee chats[^virtual-social]
- Online team games[^team-games]
- Quarterly in-person meetups[^meetup-benefits]

[^remote-stats]: Pew Research Center. "Remote Work Statistics 2023." Pew Research, 2023.
[^communication-study]: Harvard Business Review. "The Science of Remote Team Communication." HBR, 2023.
[^standup-guide]: Agile Alliance. "Effective Daily Standups for Remote Teams." AA Publications, 2023.
[^async-tools]: MIT Sloan. "Asynchronous Communication in Remote Work." MIT Sloan Review, 2023.
[^video-guidelines]: Stanford Virtual Human Interaction Lab. "Video Call Best Practices." Stanford, 2023.
[^productivity-expert]: Dr. Amanda Rodriguez, Remote Work Consultant, interviewed February 2024.
[^time-blocking]: Cal Newport. "Deep Work: Rules for Focused Success." Grand Central Publishing, 2016.
[^break-research]: University of Illinois. "The Importance of Mental Breaks." UI Psychology Dept, 2023.
[^boundary-setting]: Work-Life Balance Institute. "Setting Boundaries in Remote Work." WLBI, 2023.
[^workspace-study]: Cornell University. "Home Office Environment and Productivity." Cornell ILR, 2023.
[^dedicated-space]: Psychology Today. "The Psychology of Dedicated Workspaces." PT, 2023.
[^lighting-importance]: Lighting Research Center. "Impact of Lighting on Remote Work Performance." LRC, 2023.
[^ergonomics]: Occupational Safety and Health Administration. "Ergonomics for Remote Workers." OSHA, 2023.
[^team-building]: Gallup. "Building Engagement in Remote Teams." Gallup Workplace, 2023.
[^virtual-social]: Microsoft. "The Future of Work: Social Connection in Remote Teams." Microsoft Research, 2023.
[^team-games]: Team Building Hub. "Virtual Team Building Activities That Work." TBH, 2023.
[^meetup-benefits]: Buffer. "State of Remote Work 2023: The Value of In-Person Connection." Buffer, 2023.`;

			const result = renumberFootnotes(content);

			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(15);

			// Verify footnotes in various contexts are preserved
			expect(result.content).toContain(
				"many professionals[^1]. Here are"
			);
			expect(result.content).toContain("work success[^2]. Consider");
			expect(result.content).toContain("and focused[^3]");
			expect(result.content).toContain('personal life."[^6]');

			// Check formatting in lists and quotes is maintained
			expect(result.content).toContain(
				"1. **Daily standups**: Keep them short and focused[^3]"
			);
			expect(result.content).toContain(
				'> "The key to remote productivity is creating boundaries between work and personal life."[^6]'
			);
			expect(result.content).toContain(
				"- Use time-blocking techniques[^7]"
			);
		});
	});
});
