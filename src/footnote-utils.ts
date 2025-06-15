/**
 * Footnote utility functions for Better Footnotes plugin
 */

export interface FootnoteRenumberResult {
	content: string;
	changed: boolean;
	footnoteCount: number;
}

/**
 * Renumbers all footnotes in the given content to sequential numbers (1, 2, 3...)
 * based on their order of appearance in the text.
 *
 * @param content - The markdown content containing footnotes
 * @returns FootnoteRenumberResult with updated content and metadata
 */
export function renumberFootnotes(content: string): FootnoteRenumberResult {
	if (!content || typeof content !== "string") {
		return {
			content: content || "",
			changed: false,
			footnoteCount: 0,
		};
	}

	// Find all footnote references in order of appearance (ignoring original names)
	const footnoteRefRegex = /\[\^([^\]]+)\]/g;
	const seenLabels = new Set<string>();
	const orderedLabels: string[] = [];
	let match;

	// Collect unique footnote labels in the exact order they first appear in the text
	while ((match = footnoteRefRegex.exec(content)) !== null) {
		const originalLabel = match[1];
		if (!seenLabels.has(originalLabel)) {
			seenLabels.add(originalLabel);
			orderedLabels.push(originalLabel);
		}
	}

	if (orderedLabels.length === 0) {
		return {
			content,
			changed: false,
			footnoteCount: 0,
		};
	}

	// Create mapping: original label -> sequential number (1, 2, 3...)
	// This completely ignores what the original name was
	const labelToSequentialNumber: { [originalLabel: string]: string } = {};
	orderedLabels.forEach((originalLabel, index) => {
		labelToSequentialNumber[originalLabel] = (index + 1).toString();
	});

	let updatedContent = content;

	// Replace all occurrences while preserving reference-definition linking
	for (const [originalLabel, newNumber] of Object.entries(
		labelToSequentialNumber
	)) {
		// Escape special regex characters in the original label
		const escapedOriginalLabel = originalLabel.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);

		// Replace all footnote references [^originalLabel] -> [^newNumber]
		const refRegex = new RegExp(`\\[\\^${escapedOriginalLabel}\\]`, "g");
		updatedContent = updatedContent.replace(refRegex, `[^${newNumber}]`);

		// Replace footnote definitions [^originalLabel]: -> [^newNumber]:
		// This preserves the link between reference and its content
		const defRegex = new RegExp(
			`^(\\s*\\[\\^${escapedOriginalLabel}\\]:)`,
			"gm"
		);
		updatedContent = updatedContent.replace(defRegex, `[^${newNumber}]:`);
	}

	return {
		content: updatedContent,
		changed: updatedContent !== content,
		footnoteCount: orderedLabels.length,
	};
}
