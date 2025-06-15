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
 * based on their order of appearance in the text, and sorts footnote definitions accordingly.
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

	// Step 3: Find and collect all footnote definitions
	const lines = content.split(/\r?\n/); // Handle both \n and \r\n
	const footnoteDefinitions: Array<{
		originalLabel: string;
		newNumber: string;
		content: string;
		indentation: string;
	}> = [];
	const nonFootnoteLines: string[] = [];
	let footnoteStartIndex = -1;

	// Separate footnote definitions from other content
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const defMatch = line.match(/^(\s*)\[\^([^\]]+)\]:\s*(.*)$/);

		if (defMatch) {
			const [, indentation, originalLabel, defContent] = defMatch;
			const newNumber = labelToSequentialNumber[originalLabel];

			if (newNumber) {
				// This is a footnote definition we need to renumber
				footnoteDefinitions.push({
					originalLabel,
					newNumber,
					content: defContent,
					indentation,
				});

				// Mark where footnotes start if not already marked
				if (footnoteStartIndex === -1) {
					footnoteStartIndex = i;
				}
			} else {
				// This is a footnote definition without a reference - keep as is
				nonFootnoteLines.push(line);
			}
		} else {
			// Not a footnote definition
			if (footnoteStartIndex === -1) {
				// We haven't reached footnotes yet
				nonFootnoteLines.push(line);
			} else {
				// We're in the footnote section but this isn't a footnote
				// (could be empty line or other content)
				nonFootnoteLines.push(line);
			}
		}
	}

	// Step 4: Sort footnote definitions by their new sequential numbers
	footnoteDefinitions.sort(
		(a, b) => parseInt(a.newNumber) - parseInt(b.newNumber)
	);

	// Step 5: Replace footnote references in the non-footnote content
	// Preserve original line endings
	const originalLineEnding = content.includes("\r\n") ? "\r\n" : "\n";
	let updatedContent = nonFootnoteLines.join(originalLineEnding);

	// Use temporary placeholders to avoid conflicts during replacement
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
	}

	// Step 6: Add sorted footnote definitions back to the content
	if (footnoteDefinitions.length > 0) {
		// Find where to insert footnotes (preserve spacing)
		const contentLines = updatedContent.split(/\r?\n/);
		let insertIndex = contentLines.length;

		// Check if there are empty lines at the end and preserve them
		let emptyLinesAtEnd = 0;
		for (let i = contentLines.length - 1; i >= 0; i--) {
			if (contentLines[i].trim() === "") {
				emptyLinesAtEnd++;
			} else {
				break;
			}
		}

		// Ensure at least one empty line before footnotes, but preserve existing spacing
		if (emptyLinesAtEnd === 0) {
			updatedContent += originalLineEnding + originalLineEnding;
		} else if (emptyLinesAtEnd === 1) {
			updatedContent += originalLineEnding;
		}
		// If emptyLinesAtEnd > 1, preserve existing spacing

		// Add sorted footnote definitions
		const sortedFootnoteLines = footnoteDefinitions.map(
			(def) => `${def.indentation}[^${def.newNumber}]: ${def.content}`
		);
		updatedContent += sortedFootnoteLines.join(originalLineEnding);
	}

	return {
		content: updatedContent,
		changed: updatedContent !== content,
		footnoteCount: orderedLabels.length,
	};
}
