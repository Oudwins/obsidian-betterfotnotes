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

	// Step 1: Find all footnote references in order of appearance (ignoring original names)
	// Only look for references [^label], NOT definitions [^label]:
	// Handle escaped brackets properly: match everything until unescaped ]
	const footnoteRefRegex = /\[\^((?:[^\]\\]|\\.)+)\](?!:)/g;
	const seenLabels = new Set<string>();
	const orderedLabels: string[] = [];
	let match;

	// Reset regex lastIndex to scan from beginning
	footnoteRefRegex.lastIndex = 0;

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

	// Step 2: Create mapping: original label -> sequential number (1, 2, 3...)
	// This completely ignores what the original name was
	const labelToSequentialNumber: { [originalLabel: string]: string } = {};
	orderedLabels.forEach((originalLabel, index) => {
		labelToSequentialNumber[originalLabel] = (index + 1).toString();
	});

	// Step 3: Replace all occurrences using a different approach to avoid conflicts
	// We'll use temporary placeholders first, then replace with final numbers
	let updatedContent = content;
	const tempPlaceholders: { [originalLabel: string]: string } = {};

	// First pass: Replace with temporary unique placeholders
	for (const [originalLabel, newNumber] of Object.entries(
		labelToSequentialNumber
	)) {
		// Create a unique temporary placeholder that won't conflict
		const tempPlaceholder = `__TEMP_FOOTNOTE_${Math.random()
			.toString(36)
			.substr(2, 9)}__`;
		tempPlaceholders[tempPlaceholder] = newNumber;

		// Escape special regex characters in the original label
		const escapedOriginalLabel = originalLabel.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);

		// Replace all footnote references [^originalLabel] -> [^tempPlaceholder]
		const refRegex = new RegExp(
			`\\[\\^${escapedOriginalLabel}\\](?!:)`,
			"g"
		);
		updatedContent = updatedContent.replace(
			refRegex,
			`[^${tempPlaceholder}]`
		);

		// Replace footnote definitions [^originalLabel]: -> [^tempPlaceholder]:
		// Preserve the original indentation/whitespace
		const defRegex = new RegExp(
			`^(\\s*)(\\[\\^${escapedOriginalLabel}\\]:)`,
			"gm"
		);
		updatedContent = updatedContent.replace(
			defRegex,
			`$1[^${tempPlaceholder}]:`
		);
	}

	// Second pass: Replace temporary placeholders with final numbers
	for (const [tempPlaceholder, newNumber] of Object.entries(
		tempPlaceholders
	)) {
		const escapedPlaceholder = tempPlaceholder.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);

		// Replace references
		const refRegex = new RegExp(`\\[\\^${escapedPlaceholder}\\](?!:)`, "g");
		updatedContent = updatedContent.replace(refRegex, `[^${newNumber}]`);

		// Replace definitions
		// Preserve the original indentation/whitespace
		const defRegex = new RegExp(
			`^(\\s*)(\\[\\^${escapedPlaceholder}\\]:)`,
			"gm"
		);
		updatedContent = updatedContent.replace(defRegex, `$1[^${newNumber}]:`);
	}

	return {
		content: updatedContent,
		changed: updatedContent !== content,
		footnoteCount: orderedLabels.length,
	};
}
