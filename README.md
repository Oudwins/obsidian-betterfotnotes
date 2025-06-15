# Better Footnotes

An enhanced footnote workflow plugin for [Obsidian](https://obsidian.md) that streamlines footnote management with intelligent auto-numbering, custom prompts, and automatic sorting.

## Features

### 🔄 **Smart Auto-Numbering**

-   Automatically renumbers all footnotes sequentially (1, 2, 3...) based on their order of appearance in the text
-   Maintains consistency even when footnotes are added, removed, or reordered
-   Ignores original footnote labels and creates a clean, sequential numbering system

### 📝 **Enhanced Insert Experience**

-   Replaces Obsidian's default footnote insertion with a custom command
-   Shows an intuitive modal dialog to input footnote text
-   Supports keyboard shortcuts (Enter to confirm, Escape to cancel)
-   Maintains the familiar `Ctrl/Cmd + ^` hotkey

### 🗂️ **Intelligent Organization**

-   Automatically sorts footnote definitions at the bottom of the file
-   Orders definitions to match the sequence of references in the text
-   Preserves proper spacing and formatting
-   Handles mixed content gracefully

### 💾 **Built-in Backup System**

-   Creates automatic backups before making changes
-   Timestamps backup files for easy identification
-   Automatic cleanup of backups older than 30 days
-   Stores backups in the plugin's dedicated folder

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Better Footnotes"
4. Click Install and Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/yourusername/obsidian-better-footnotes/releases)
2. Extract the files to your vault's `.obsidian/plugins/better-footnotes/` directory
3. Reload Obsidian and enable the plugin in Settings > Community Plugins

## Usage

### Creating Footnotes

1. **Use the keyboard shortcut**: Press `Ctrl/Cmd + ^` (same as default Obsidian)
2. **Use the command palette**: Search for "Insert footnote"
3. **Enter your footnote text** in the modal dialog
4. The plugin will automatically:
    - Insert the footnote reference at your cursor position
    - Add the footnote definition at the bottom of the file
    - Number it sequentially based on existing footnotes

### Example Workflow

**Before:**

```markdown
This is some text with a footnote[^note1] and another[^xyz].

[^xyz]: Second footnote
[^note1]: First footnote
```

**After using Better Footnotes:**

```markdown
This is some text with a footnote[^1] and another[^2].

[^1]: First footnote
[^2]: Second footnote
```

### Renumbering Existing Footnotes

The plugin automatically renumbers footnotes whenever you insert a new one. All footnote references and definitions are updated to maintain sequential order based on their appearance in the text.

## Key Benefits

-   **Consistency**: Never worry about footnote numbering again
-   **Clean Organization**: Footnotes are always properly ordered and formatted
-   **Safety**: Automatic backups protect your work
-   **Seamless Integration**: Works with existing Obsidian workflows
-   **Performance**: Efficient processing even with many footnotes

## Development

### Prerequisites

-   Node.js v16 or higher
-   npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-better-footnotes.git
cd obsidian-better-footnotes

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building

```bash
# Build for production
npm run build
```

### Project Structure

```
├── main.ts              # Main plugin file
├── src/
│   ├── footnote-utils.ts # Core footnote processing logic
│   └── *.test.ts        # Test files
├── manifest.json        # Plugin manifest
├── package.json         # Node.js configuration
└── README.md            # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this plugin helpful, consider:

-   ⭐ Starring the repository
-   🐛 Reporting bugs or suggesting features via [GitHub Issues](https://github.com/yourusername/obsidian-better-footnotes/issues)
-   💬 Sharing your experience with the community

## Changelog

### 1.0.0

-   Initial release
-   Smart auto-numbering based on appearance order
-   Enhanced footnote insertion with custom modal
-   Automatic footnote sorting and organization
-   Built-in backup system with automatic cleanup
-   Comprehensive test coverage

---

Made with ❤️ for the Obsidian community
