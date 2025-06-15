import { renumberFootnotes } from "./src/footnote-utils";

// Test simple case
const simpleContent =
	"This has a footnote[^abc] in it.\n\n[^abc]: Footnote content";
console.log("=== SIMPLE TEST ===");
console.log("Input:");
console.log(JSON.stringify(simpleContent));

const result = renumberFootnotes(simpleContent);
console.log("Output:");
console.log(JSON.stringify(result.content));
console.log("Expected:");
console.log(
	JSON.stringify("This has a footnote[^1] in it.\n\n[^1]: Footnote content")
);

// Test specific special character case
const specialContent = `Test[^note.*+?^$\\{\\}()|\\] with special chars.

[^note.*+?^$\\{\\}()|\\]: Content with special label`;

console.log("=== SPECIAL CHARS TEST ===");
console.log("Input:");
console.log(JSON.stringify(specialContent));

const result2 = renumberFootnotes(specialContent);
console.log("Output:");
console.log(JSON.stringify(result2.content));
console.log("Result details:", {
	changed: result2.changed,
	footnoteCount: result2.footnoteCount,
});

// Test if the regex is matching the footnote
const footnoteRefRegex = /\[\^((?:[^\]\\]|\\.)+)\](?!:)/g;
let match;
console.log("\n=== REGEX MATCHES ===");
while ((match = footnoteRefRegex.exec(specialContent)) !== null) {
	console.log("Found footnote label:", JSON.stringify(match[1]));
}
