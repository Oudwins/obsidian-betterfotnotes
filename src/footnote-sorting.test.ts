import { describe, it, expect } from "vitest";
import { renumberFootnotes } from "./footnote-utils";

describe("Footnote Sorting and Spacing", () => {
	describe("footnote definition sorting", () => {
		it("should maintain sorted order when adding new footnotes", () => {
			const content = `Text with footnotes[^2] and[^1] more.

[^2]: Second footnote
[^1]: First footnote`;

			const result = renumberFootnotes(content);

			// After renumbering, footnotes should be in order of appearance
			expect(result.content).toBe(`Text with footnotes[^1] and[^2] more.

[^1]: Second footnote
[^2]: First footnote`);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(2);
		});

		it("should handle mixed numeric and text footnote labels", () => {
			const content = `Text[^abc] with[^5] mixed[^1] footnotes.

[^5]: Fifth footnote
[^abc]: Text footnote
[^1]: First footnote`;

			const result = renumberFootnotes(content);

			// Renumbered based on order of appearance: abc=1, 5=2, 1=3
			// Definitions sorted by new numbers: 1, 2, 3
			expect(result.content).toBe(`Text[^1] with[^2] mixed[^3] footnotes.

[^1]: Text footnote
[^2]: Fifth footnote
[^3]: First footnote`);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(3);
		});

		it("should preserve spacing between content and footnotes", () => {
			const content = `Main content here.


[^1]: Footnote with multiple empty lines above`;

			const result = renumberFootnotes(content);

			// Should preserve the multiple empty lines
			expect(result.content).toBe(`Main content here.


[^1]: Footnote with multiple empty lines above`);
			expect(result.changed).toBe(false); // No change needed
		});

		it("should handle footnotes with indentation", () => {
			const content = `Text[^1] and[^2] footnotes.

    [^2]: Indented footnote
        [^1]: More indented footnote`;

			const result = renumberFootnotes(content);

			// Definitions reordered to match reference order (1 then 2)
			expect(result.content).toBe(`Text[^1] and[^2] footnotes.

        [^1]: More indented footnote
    [^2]: Indented footnote`);
			expect(result.changed).toBe(true);
		});
	});

	describe("footnote insertion scenarios", () => {
		it("should handle inserting footnote in middle of existing sequence", () => {
			// Simulating what happens when user inserts footnote between existing ones
			const content = `First[^1] and third[^3] footnotes.

[^1]: First footnote
[^3]: Third footnote`;

			// After adding a footnote in the middle, renumbering should fix order
			const contentWithNewFootnote = `First[^1] and second[^2] and third[^3] footnotes.

[^1]: First footnote
[^2]: New middle footnote
[^3]: Third footnote`;

			const result = renumberFootnotes(contentWithNewFootnote);

			expect(result.content)
				.toBe(`First[^1] and second[^2] and third[^3] footnotes.

[^1]: First footnote
[^2]: New middle footnote
[^3]: Third footnote`);
			expect(result.footnoteCount).toBe(3);
		});

		it("should handle out-of-order footnote definitions", () => {
			const content = `Text[^1] with[^2] footnotes[^3].

[^3]: Third footnote
[^1]: First footnote
[^2]: Second footnote`;

			const result = renumberFootnotes(content);

			// Definitions should be reordered to match reference order
			expect(result.content).toBe(`Text[^1] with[^2] footnotes[^3].

[^1]: First footnote
[^2]: Second footnote
[^3]: Third footnote`);
			expect(result.changed).toBe(true);
		});

		it("should handle footnotes with complex content", () => {
			const content = `Academic text[^ref1] with citations[^ref2].

[^ref2]: This is a longer footnote with **bold text** and [links](http://example.com).
[^ref1]: Simple footnote.`;

			const result = renumberFootnotes(content);

			// Reordered based on appearance: ref1=1, ref2=2
			expect(result.content).toBe(`Academic text[^1] with citations[^2].

[^1]: Simple footnote.
[^2]: This is a longer footnote with **bold text** and [links](http://example.com).`);
			expect(result.changed).toBe(true);
		});
	});

	describe("edge cases and robustness", () => {
		it("should handle footnotes at very beginning of document", () => {
			const content = `[^1] starts immediately.

[^1]: First footnote`;

			const result = renumberFootnotes(content);

			expect(result.content).toBe(content); // Should remain unchanged
			expect(result.changed).toBe(false);
		});

		it("should handle multiple footnotes in same paragraph", () => {
			const content = `Text[^1] with[^2] multiple[^3] footnotes[^4] in one paragraph.

[^4]: Fourth
[^3]: Third  
[^2]: Second
[^1]: First`;

			const result = renumberFootnotes(content);

			// Definitions reordered to match reference order (1,2,3,4)
			expect(result.content)
				.toBe(`Text[^1] with[^2] multiple[^3] footnotes[^4] in one paragraph.

[^1]: First
[^2]: Second
[^3]: Third  
[^4]: Fourth`);
			expect(result.changed).toBe(true);
		});

		it("should handle footnotes with special characters in content", () => {
			const content = `Text[^1] with special chars[^2].

[^2]: Footnote with "quotes" and 'apostrophes' and [brackets].
[^1]: Simple footnote with $symbols$ and #hashtags.`;

			const result = renumberFootnotes(content);

			// Reordered based on appearance order
			expect(result.content).toBe(`Text[^1] with special chars[^2].

[^1]: Simple footnote with $symbols$ and #hashtags.
[^2]: Footnote with "quotes" and 'apostrophes' and [brackets].`);
			expect(result.changed).toBe(true);
		});

		it("should handle empty footnote definitions", () => {
			const content = `Text[^1] with empty[^2] footnotes.

[^1]: 
[^2]: Has content`;

			const result = renumberFootnotes(content);

			expect(result.content).toBe(`Text[^1] with empty[^2] footnotes.

[^1]: 
[^2]: Has content`);
			expect(result.changed).toBe(false);
		});

		it("should handle very large numbers", () => {
			const content = `Text[^999] with[^1000] large numbers.

[^1000]: Thousand footnote
[^999]: Nine ninety nine`;

			const result = renumberFootnotes(content);

			// Reordered based on appearance: 999=1, 1000=2
			expect(result.content).toBe(`Text[^1] with[^2] large numbers.

[^1]: Nine ninety nine
[^2]: Thousand footnote`);
			expect(result.changed).toBe(true);
		});
	});

	describe("spacing preservation", () => {
		it("should preserve single empty line between content and footnotes", () => {
			const content = `Content here.

[^1]: Footnote`;

			const result = renumberFootnotes(content);

			expect(result.content).toBe(content);
			expect(result.changed).toBe(false);
		});

		it("should preserve multiple empty lines between content and footnotes", () => {
			const content = `Content here.



[^1]: Footnote with lots of space above`;

			const result = renumberFootnotes(content);

			expect(result.content).toBe(content);
			expect(result.changed).toBe(false);
		});

		it("should handle no spacing between content and footnotes", () => {
			const content = `Content here.
[^1]: Footnote immediately after`;

			const result = renumberFootnotes(content);

			// Should preserve the direct connection (no spacing added)
			expect(result.content).toBe(content);
			expect(result.changed).toBe(false);
		});
	});

	describe("real-world document scenarios", () => {
		it("should handle academic paper with many footnotes", () => {
			const content = `This research[^smith2020] builds on previous work[^jones2019] in the field[^brown2021].

The methodology[^methods] follows established protocols[^protocols] with modifications[^mods].

[^brown2021]: Brown, A. (2021). Recent advances in the field.
[^smith2020]: Smith, J. (2020). Foundational research paper.
[^jones2019]: Jones, B. (2019). Previous work in this area.
[^protocols]: Standard protocols document, version 2.1.
[^methods]: See appendix A for detailed methodology.
[^mods]: Modifications described in section 3.2.`;

			const result = renumberFootnotes(content);

			// Reordered based on appearance: smith2020=1, jones2019=2, brown2021=3, methods=4, protocols=5, mods=6
			const expected = `This research[^1] builds on previous work[^2] in the field[^3].

The methodology[^4] follows established protocols[^5] with modifications[^6].

[^1]: Smith, J. (2020). Foundational research paper.
[^2]: Jones, B. (2019). Previous work in this area.
[^3]: Brown, A. (2021). Recent advances in the field.
[^4]: See appendix A for detailed methodology.
[^5]: Standard protocols document, version 2.1.
[^6]: Modifications described in section 3.2.`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(6);
		});

		it("should handle blog post with mixed footnote styles", () => {
			const content = `I love this product[^affiliate] and here's why[^reasons].

You can buy it here[^link] or check alternatives[^alternatives].

[^affiliate]: This is an affiliate link - I may earn commission.
[^link]: https://example.com/product
[^reasons]: See my detailed review below.
[^alternatives]: Alternative products listed in appendix.`;

			const result = renumberFootnotes(content);

			// Reordered based on appearance: affiliate=1, reasons=2, link=3, alternatives=4
			const expected = `I love this product[^1] and here's why[^2].

You can buy it here[^3] or check alternatives[^4].

[^1]: This is an affiliate link - I may earn commission.
[^2]: See my detailed review below.
[^3]: https://example.com/product
[^4]: Alternative products listed in appendix.`;

			expect(result.content).toBe(expected);
			expect(result.changed).toBe(true);
			expect(result.footnoteCount).toBe(4);
		});
	});
});
