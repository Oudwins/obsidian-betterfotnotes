import { describe, it, expect } from "vitest";

describe("Cursor Positioning Logic", () => {
	describe("footnote reference matching", () => {
		it("should find footnote reference after cursor position", () => {
			const lineContent = "This is some text[^1] with a footnote.";
			const cursorCh = 17; // Position right before [^1]

			const afterCursor = lineContent.substring(cursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).not.toBeNull();
			expect(footnoteMatch![0]).toBe("[^1]");
			expect(footnoteMatch!.index).toBe(0); // Immediately after cursor
		});

		it("should handle multiple footnotes in line", () => {
			const lineContent = "Text[^1] and more[^2] footnotes[^3] here.";
			const cursorCh = 4; // Position right before [^1]

			const afterCursor = lineContent.substring(cursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).not.toBeNull();
			expect(footnoteMatch![0]).toBe("[^1]");
			expect(footnoteMatch!.index).toBe(0);
		});

		it("should find first footnote when cursor is before multiple footnotes", () => {
			const lineContent = "Text with[^5] and[^2] footnotes.";
			const cursorCh = 9; // Position right before [^5]

			const afterCursor = lineContent.substring(cursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).not.toBeNull();
			expect(footnoteMatch![0]).toBe("[^5]");
		});

		it("should return null when no footnote after cursor", () => {
			const lineContent = "Text[^1] with no footnote after cursor.";
			const cursorCh = 30; // Position after the footnote

			const afterCursor = lineContent.substring(cursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).toBeNull();
		});

		it("should calculate correct cursor position after footnote", () => {
			const lineContent = "Some text[^1] here.";
			const originalCursorCh = 9; // Position right before [^1]

			const afterCursor = lineContent.substring(originalCursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).not.toBeNull();
			if (footnoteMatch && footnoteMatch.index !== undefined) {
				const newCursorPos =
					originalCursorCh +
					footnoteMatch.index +
					footnoteMatch[0].length;
				expect(newCursorPos).toBe(13); // After "[^1]"
				expect(lineContent.charAt(newCursorPos)).toBe(" "); // Should be the space after footnote
			}
		});

		it("should handle footnotes with different number lengths", () => {
			const lineContent = "Text[^123] with long footnote number.";
			const cursorCh = 4; // Position right before [^123]

			const afterCursor = lineContent.substring(cursorCh);
			const footnoteMatch = afterCursor.match(/\[\^\d+\]/);

			expect(footnoteMatch).not.toBeNull();
			expect(footnoteMatch![0]).toBe("[^123]");

			if (footnoteMatch && footnoteMatch.index !== undefined) {
				const newCursorPos =
					cursorCh + footnoteMatch.index + footnoteMatch[0].length;
				expect(newCursorPos).toBe(10); // After "[^123]"
			}
		});
	});
});
