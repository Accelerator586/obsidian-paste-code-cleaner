# Paste Code Cleaner

An Obsidian plugin that cleans trailing whitespace in code blocks. Useful for code copied from terminals, CLI tools like Claude Code, Cursor, and other AI assistants.

## Problem

When copying code from terminal applications or CLI tools, trailing whitespace is often included. This can cause rendering issues in Obsidian's markdown preview, especially with code blocks.

## Features

- **Clean Code Block**: Remove trailing whitespace from code blocks
- **Select Code Block**: Quickly select the entire code block at cursor
- **Auto-clean on Paste** (Optional): Automatically clean trailing whitespace when pasting

## Usage

### Commands

Open the command palette (`Cmd/Ctrl + P`) and search for:

- **Clean code block (remove trailing whitespace)**: Cleans the code block at cursor, or cleans selected text
- **Select code block**: Selects the entire code block where your cursor is located

### Behavior

1. **With selected text**: Cleans trailing whitespace in the selection
2. **Without selection, cursor in code block**: Cleans the entire code block
3. **Without selection, cursor outside code block**: Shows a notice

### Settings

- **Auto-clean on paste**: When enabled, automatically removes trailing whitespace from all pasted content (disabled by default)

## Installation

### Manual Installation

1. Download `main.js` and `manifest.json` from the latest release
2. Create a folder `paste-code-cleaner` in your vault's `.obsidian/plugins/` directory
3. Copy `main.js` and `manifest.json` into the folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community plugins

### From Source

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/paste-code-cleaner/` directory

## License

MIT
