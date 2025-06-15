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

			const expected = `This text has[^1] some content[^2] and more[^3] footnotes.

[^2]: Second footnote content
[^3]: Third footnote content  
[^1]: First footnote content`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(3);
		});

		it("should handle duplicate footnote references", () => {
			const content = `This text has[^xyz] some content[^note] and more[^xyz] references.

[^note]: Second footnote content
[^xyz]: First footnote content (referenced twice)`;

			const result = renumberFootnotes(content);

			const expected = `This text has[^1] some content[^2] and more[^1] references.

[^2]: Second footnote content
[^1]: First footnote content (referenced twice)`;

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

		it("should handle complex regex-special characters in footnote labels", () => {
			const content = `Test[^note.*+?^()|[]\\] with special chars.

[^note.*+?^()|[]\\]: Content with special label`;

			const result = renumberFootnotes(content);

			const expected = `Test[^1] with special chars.

[^1]: Content with special label`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(1);
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
});
