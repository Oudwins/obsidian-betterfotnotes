import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock obsidian module before importing main
vi.mock("obsidian", () => ({
	Plugin: class MockPlugin {
		app: any;
		manifest: any;
		constructor(app: any, manifest: any) {
			this.app = app;
			this.manifest = manifest;
		}
		loadData = vi.fn();
		saveData = vi.fn();
		registerInterval = vi.fn();
	},
	Modal: class MockModal {
		app: any;
		constructor(app: any) {
			this.app = app;
		}
		open = vi.fn();
		close = vi.fn();
	},
	Setting: vi.fn().mockImplementation(() => ({
		setName: vi.fn().mockReturnThis(),
		addText: vi.fn().mockReturnThis(),
		addButton: vi.fn().mockReturnThis(),
		setButtonText: vi.fn().mockReturnThis(),
		setCta: vi.fn().mockReturnThis(),
		onClick: vi.fn().mockReturnThis(),
		setPlaceholder: vi.fn().mockReturnThis(),
		onChange: vi.fn().mockReturnThis(),
	})),
}));

import BetterFootnotes from "../main";

// Mock Obsidian API
const mockApp = {
	workspace: {
		onLayoutReady: vi.fn(),
		getActiveViewOfType: vi.fn(),
	},
	vault: {
		read: vi.fn(),
		adapter: {
			mkdir: vi.fn(),
			write: vi.fn(),
			exists: vi.fn(),
			list: vi.fn(),
			stat: vi.fn(),
			remove: vi.fn(),
		},
	},
	commands: {
		commands: {},
		addCommand: vi.fn(),
	},
};

const mockEditor = {
	getValue: vi.fn(),
	setValue: vi.fn(),
	getCursor: vi.fn(),
	replaceRange: vi.fn(),
};

const mockView = {
	file: {
		basename: "test-file",
		extension: "md",
	},
};

// Mock the FootnoteInputModal
vi.mock("obsidian", () => ({
	Plugin: class MockPlugin {
		app: any;
		manifest: any;
		constructor() {
			this.app = mockApp;
			this.manifest = { dir: "/test-plugin-dir" };
		}
		loadData = vi.fn();
		saveData = vi.fn();
		registerInterval = vi.fn();
	},
	Modal: class MockModal {
		app: any;
		constructor(app: any) {
			this.app = app;
		}
		open = vi.fn();
		close = vi.fn();
	},
	Setting: vi.fn().mockImplementation(() => ({
		setName: vi.fn().mockReturnThis(),
		addText: vi.fn().mockReturnThis(),
		addButton: vi.fn().mockReturnThis(),
		setButtonText: vi.fn().mockReturnThis(),
		setCta: vi.fn().mockReturnThis(),
		onClick: vi.fn().mockReturnThis(),
		setPlaceholder: vi.fn().mockReturnThis(),
		onChange: vi.fn().mockReturnThis(),
	})),
}));

describe("BetterFootnotes Plugin", () => {
	let plugin: BetterFootnotes;

	beforeEach(() => {
		vi.clearAllMocks();
		plugin = new BetterFootnotes(
			mockApp as any,
			{ dir: "/test-plugin-dir" } as any
		);
		plugin.app = mockApp as any;
		plugin.manifest = { dir: "/test-plugin-dir" } as any;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Plugin Initialization", () => {
		it("should initialize with default settings", async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			plugin.loadData = vi.fn().mockResolvedValue({});

			await plugin.onload();

			expect(plugin.settings).toEqual({
				mySetting: "default",
			});
		});

		it("should set up cleanup intervals", async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			plugin.loadData = vi.fn().mockResolvedValue({});

			await plugin.onload();

			expect(plugin.registerInterval).toHaveBeenCalled();
		});

		it("should replace footnote command on layout ready", async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);
			plugin.loadData = vi.fn().mockResolvedValue({});

			let layoutReadyCallback: () => void;
			mockApp.workspace.onLayoutReady.mockImplementation((callback) => {
				layoutReadyCallback = callback;
			});

			await plugin.onload();

			// Simulate layout ready
			layoutReadyCallback!();

			expect(mockApp.workspace.onLayoutReady).toHaveBeenCalled();
		});
	});

	describe("Footnote Number Generation", () => {
		it("should return 1 for content without footnotes", () => {
			const content = "This is just regular text.";
			const result = plugin.getNextFootnoteNumber(content);
			expect(result).toBe(1);
		});

		it("should return next sequential number", () => {
			const content = `Text with[^1] footnotes[^2] and[^3] more.

[^1]: First footnote
[^2]: Second footnote
[^3]: Third footnote`;

			const result = plugin.getNextFootnoteNumber(content);
			expect(result).toBe(4);
		});

		it("should handle non-sequential existing footnotes", () => {
			const content = `Text with[^5] footnotes[^10] and[^2] more.

[^5]: Fifth footnote
[^10]: Tenth footnote
[^2]: Second footnote`;

			const result = plugin.getNextFootnoteNumber(content);
			expect(result).toBe(11); // Should be max + 1
		});

		it("should handle mixed numeric and text footnotes", () => {
			const content = `Text with[^abc] footnotes[^5] and[^xyz] more.

[^abc]: Text footnote
[^5]: Numeric footnote
[^xyz]: Another text footnote`;

			const result = plugin.getNextFootnoteNumber(content);
			expect(result).toBe(6); // Should find max numeric (5) + 1
		});
	});

	describe("Backup Creation", () => {
		it("should create backup with timestamp", async () => {
			const mockDate = new Date("2024-01-15T10:30:00.000Z");
			vi.setSystemTime(mockDate);

			mockApp.vault.read.mockResolvedValue("File content");
			mockApp.vault.adapter.mkdir.mockResolvedValue(undefined);
			mockApp.vault.adapter.write.mockResolvedValue(undefined);

			await plugin.createBackup(mockView as any);

			expect(mockApp.vault.read).toHaveBeenCalledWith(mockView.file);
			expect(mockApp.vault.adapter.mkdir).toHaveBeenCalledWith(
				"/test-plugin-dir/backups"
			);
			expect(mockApp.vault.adapter.write).toHaveBeenCalledWith(
				"/test-plugin-dir/backups/test-file_backup_2024-01-15T10-30-00-000Z.md",
				"File content"
			);
		});

		it("should handle backup creation errors gracefully", async () => {
			mockApp.vault.read.mockRejectedValue(new Error("Read failed"));

			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await plugin.createBackup(mockView as any);

			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to create backup:",
				expect.any(Error)
			);
			consoleSpy.mockRestore();
		});
	});

	describe("Backup Cleanup", () => {
		it("should remove old backups", async () => {
			const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;

			mockApp.vault.adapter.exists.mockResolvedValue(true);
			mockApp.vault.adapter.list.mockResolvedValue({
				files: ["old-backup.md", "recent-backup.md"],
				folders: [],
			});
			mockApp.vault.adapter.stat
				.mockResolvedValueOnce({
					type: "file",
					ctime: thirtyOneDaysAgo, // Old file
				})
				.mockResolvedValueOnce({
					type: "file",
					ctime: Date.now(), // Recent file
				});

			await plugin.cleanupOldBackups();

			expect(mockApp.vault.adapter.remove).toHaveBeenCalledWith(
				"/test-plugin-dir/backups/old-backup.md"
			);
			expect(mockApp.vault.adapter.remove).toHaveBeenCalledTimes(1);
		});

		it("should handle missing backup folder", async () => {
			mockApp.vault.adapter.exists.mockResolvedValue(false);

			await plugin.cleanupOldBackups();

			expect(mockApp.vault.adapter.list).not.toHaveBeenCalled();
		});
	});

	describe("Footnote Insertion Workflow", () => {
		it("should prepare footnote insertion without immediate reference", async () => {
			const content = "Some text here.";
			mockEditor.getValue.mockReturnValue(content);
			mockEditor.getCursor.mockReturnValue({ line: 0, ch: 15 });
			mockApp.vault.read.mockResolvedValue(content);

			const consoleSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await plugin.insertCustomFootnote(
				mockEditor as any,
				mockView as any
			);

			// Should not insert reference immediately
			expect(mockEditor.replaceRange).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Preparing to insert footnote 1"
			);

			consoleSpy.mockRestore();
		});

		it("should insert both reference and definition after confirmation", async () => {
			const cursor = { line: 0, ch: 15 };
			const footnoteNumber = 1;
			const footnoteText = "This is a test footnote";

			mockEditor.getValue.mockReturnValue("Some text here.\n\n");

			await plugin.insertFootnoteReferenceAndDefinition(
				mockEditor as any,
				cursor,
				footnoteNumber,
				footnoteText
			);

			expect(mockEditor.replaceRange).toHaveBeenCalledWith(
				"[^1]",
				cursor
			);
			// Should also call addFootnoteDefinition, but that's tested separately
		});
	});

	describe("Footnote Definition Addition", () => {
		it("should add definition at end of document", async () => {
			const content = "Some text[^1] here.";
			mockEditor.getValue.mockReturnValue(content);

			await plugin.addFootnoteDefinition(
				mockEditor as any,
				1,
				"Test footnote"
			);

			expect(mockEditor.replaceRange).toHaveBeenCalledWith(
				"\n\n[^1]: Test footnote",
				{ line: 1, ch: 0 }
			);
		});

		it("should add definition before existing footnotes", async () => {
			const content = `Some text[^1] here.

[^2]: Existing footnote`;
			mockEditor.getValue.mockReturnValue(content);

			await plugin.addFootnoteDefinition(
				mockEditor as any,
				1,
				"New footnote"
			);

			expect(mockEditor.replaceRange).toHaveBeenCalledWith(
				"\n[^1]: New footnote",
				{ line: 2, ch: 0 }
			);
		});
	});

	describe("Command Replacement", () => {
		it("should replace existing footnote command", () => {
			const mockCommands = {
				commands: {
					"editor:insert-footnote": { existing: "command" },
				},
				addCommand: vi.fn(),
			};
			(plugin.app as any).commands = mockCommands;

			plugin.replaceFootnoteCommand();

			expect(
				mockCommands.commands["editor:insert-footnote"]
			).toBeUndefined();
			expect(mockCommands.addCommand).toHaveBeenCalledWith({
				id: "editor:insert-footnote",
				name: "Insert footnote",
				editorCallback: expect.any(Function),
				hotkeys: [
					{
						modifiers: ["Mod"],
						key: "^",
					},
				],
			});
		});
	});
});
