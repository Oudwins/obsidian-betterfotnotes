import { Plugin, Editor, MarkdownView, Modal, Setting } from "obsidian";
import { renumberFootnotes } from "./src/footnote-utils";

interface BetterFootnotesSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: BetterFootnotesSettings = {
	mySetting: "default",
};

export default class BetterFootnotes extends Plugin {
	settings: BetterFootnotesSettings;

	async onload() {
		await this.loadSettings();

		// Clean up old backups on startup
		await this.cleanupOldBackups();

		// Set up periodic cleanup every 24 hours
		this.registerInterval(
			window.setInterval(async () => {
				await this.cleanupOldBackups();
			}, 24 * 60 * 60 * 1000) // 24 hours in milliseconds
		);

		// Wait for app to be ready, then replace the default footnote command
		this.app.workspace.onLayoutReady(() => {
			this.replaceFootnoteCommand();
		});

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon(
		// 	"dice",
		// 	"Sample Plugin",
		// 	(evt: MouseEvent) => {
		// 		// Called when the user clicks the icon.
		// 		new Notice("This is a notice!");
		// 	}
		// );
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass("my-plugin-ribbon-class");

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText("Status Bar Text");

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: "open-sample-modal-simple",
		// 	name: "Open sample modal (simple)",
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	},
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: "sample-editor-command",
		// 	name: "Sample editor command",
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection("Sample Editor Command");
		// 	},
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createBackup(view: MarkdownView) {
		try {
			const activeFile = view.file;
			if (!activeFile) {
				console.error("No active file found");
				return;
			}

			// Read the current file content
			const content = await this.app.vault.read(activeFile);

			// Create timestamp for backup filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const originalName = activeFile.basename;
			const extension = activeFile.extension;
			const backupFileName = `${originalName}_backup_${timestamp}.${extension}`;

			// Ensure the backups folder exists
			const backupFolder = `${this.manifest.dir}/backups`;
			try {
				await this.app.vault.adapter.mkdir(backupFolder);
			} catch (error) {
				// Folder might already exist, that's fine
			}

			// Save the backup file
			const backupPath = `${backupFolder}/${backupFileName}`;
			await this.app.vault.adapter.write(backupPath, content);

			console.log(`Backup created: ${backupPath}`);
		} catch (error) {
			console.error("Failed to create backup:", error);
		}
	}

	async cleanupOldBackups() {
		try {
			const backupFolder = `${this.manifest.dir}/backups`;

			// Check if backup folder exists
			if (!(await this.app.vault.adapter.exists(backupFolder))) {
				return; // No backups folder, nothing to clean
			}

			const files = await this.app.vault.adapter.list(backupFolder);
			const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

			// files.files contains the file names
			for (const fileName of files.files) {
				try {
					const filePath = `${backupFolder}/${fileName}`;
					const fileStats = await this.app.vault.adapter.stat(
						filePath
					);

					if (
						fileStats &&
						fileStats.type === "file" &&
						fileStats.ctime < thirtyDaysAgo
					) {
						await this.app.vault.adapter.remove(filePath);
						console.log(`Deleted old backup: ${fileName}`);
					}
				} catch (fileError) {
					console.error(
						`Error processing backup file ${fileName}:`,
						fileError
					);
				}
			}
		} catch (error) {
			console.error("Failed to clean up old backups:", error);
		}
	}

	async renumberFootnotes(editor: Editor) {
		try {
			const content = editor.getValue();
			const result = renumberFootnotes(content);

			if (result.changed) {
				editor.setValue(result.content);
				console.log(
					`Renumbered ${result.footnoteCount} footnotes sequentially (1-${result.footnoteCount}) based on order of appearance`
				);
			}
		} catch (error) {
			console.error("Failed to renumber footnotes:", error);
		}
	}

	async insertCustomFootnote(editor: Editor, view: MarkdownView) {
		try {
			// Create backup of current file
			await this.createBackup(view);

			const content = editor.getValue();
			const cursor = editor.getCursor();

			// Find the next footnote number
			const nextFootnoteNumber = this.getNextFootnoteNumber(content);

			// Insert footnote reference at cursor position
			const footnoteRef = `[^${nextFootnoteNumber}]`;
			editor.replaceRange(footnoteRef, cursor);

			// Show modal for footnote text input
			new FootnoteInputModal(this.app, (footnoteText: string) => {
				this.addFootnoteDefinition(
					editor,
					nextFootnoteNumber,
					footnoteText
				);
			}).open();

			console.log(`Inserted footnote reference ${nextFootnoteNumber}`);
		} catch (error) {
			console.error("Failed to insert custom footnote:", error);
		}
	}

	async addFootnoteDefinition(
		editor: Editor,
		footnoteNumber: number,
		footnoteText: string
	) {
		try {
			const content = editor.getValue();

			// Find the end of the document to add footnote definition
			const lines = content.split("\n");
			let insertLine = lines.length;

			// Check if there are already footnote definitions at the end
			// If so, add before them, otherwise add at the very end
			let hasFootnoteSection = false;
			for (let i = lines.length - 1; i >= 0; i--) {
				const line = lines[i].trim();
				if (line === "") continue; // Skip empty lines

				if (line.match(/^\[\^[^\]]+\]:/)) {
					// Found a footnote definition
					hasFootnoteSection = true;
					continue;
				} else {
					// Found non-footnote content
					if (hasFootnoteSection) {
						// Insert before the footnote section
						insertLine = i + 1;
					}
					break;
				}
			}

			// Add footnote definition
			const footnoteDefinition = `[^${footnoteNumber}]: ${footnoteText}`;

			// Position cursor at the end of document or before existing footnotes
			const insertPosition = { line: insertLine, ch: 0 };

			// Add some spacing if needed
			let textToInsert = footnoteDefinition;
			if (insertLine < lines.length && lines[insertLine].trim() !== "") {
				textToInsert = "\n" + textToInsert;
			}
			if (insertLine === lines.length) {
				textToInsert = "\n\n" + textToInsert;
			}

			editor.replaceRange(textToInsert, insertPosition);

			// Renumber all footnotes to ensure sequential ordering
			await this.renumberFootnotes(editor);

			console.log(
				`Added footnote definition ${footnoteNumber}: ${footnoteText}`
			);
		} catch (error) {
			console.error("Failed to add footnote definition:", error);
		}
	}

	getNextFootnoteNumber(content: string): number {
		// Find all existing footnote references and definitions
		const footnoteRefs = content.match(/\[\^([^\]]+)\]/g) || [];
		const footnoteDefs = content.match(/^\[\^([^\]]+)\]:/gm) || [];

		// Combine all footnote labels
		const allFootnotes = new Set();

		footnoteRefs.forEach((ref) => {
			const match = ref.match(/\[\^([^\]]+)\]/);
			if (match) allFootnotes.add(match[1]);
		});

		footnoteDefs.forEach((def) => {
			const match = def.match(/\[\^([^\]]+)\]:/);
			if (match) allFootnotes.add(match[1]);
		});

		// Find the highest number used
		let maxNumber = 0;
		allFootnotes.forEach((label: string) => {
			const num = parseInt(label);
			if (!isNaN(num) && num > maxNumber) {
				maxNumber = num;
			}
		});

		return maxNumber + 1;
	}

	replaceFootnoteCommand() {
		// Get reference to the commands object
		const commands = (this.app as any).commands;

		// Remove the existing footnote command
		if (commands.commands["editor:insert-footnote"]) {
			delete commands.commands["editor:insert-footnote"];
		}

		// Add our replacement command with the same ID
		commands.addCommand({
			id: "editor:insert-footnote",
			name: "Insert footnote",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				console.log("Replaced Footnote command triggered!");
				await this.insertCustomFootnote(editor, view);
			},
			hotkeys: [
				{
					modifiers: ["Mod"],
					key: "^",
				},
			],
		});

		console.log("Replaced default footnote command with enhanced version");
	}
}

class FootnoteInputModal extends Modal {
	private onSubmit: (text: string) => void;
	private inputEl: HTMLInputElement;

	constructor(app: any, onSubmit: (text: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Add footnote" });

		new Setting(contentEl).setName("Footnote text").addText((text) => {
			this.inputEl = text.inputEl;
			text.setPlaceholder("Enter footnote text...").onChange((value) => {
				// Optional: could add real-time validation here
			});
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Add")
					.setCta()
					.onClick(() => {
						const footnoteText = this.inputEl.value.trim();
						if (footnoteText) {
							this.onSubmit(footnoteText);
							this.close();
						}
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			);

		// Focus the input field and select all text
		setTimeout(() => {
			this.inputEl.focus();
		}, 100);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName("Setting #1")
// 			.setDesc("It's a secret")
// 			.addText((text) =>
// 				text
// 					.setPlaceholder("Enter your secret")
// 					.setValue(this.plugin.settings.mySetting)
// 					.onChange(async (value) => {
// 						this.plugin.settings.mySetting = value;
// 						await this.plugin.saveSettings();
// 					})
// 			);
// 	}
// }
