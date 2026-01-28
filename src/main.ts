import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, PasteCodeCleanerSettings, PasteCodeCleanerSettingTab } from './settings';

interface CodeBlockInfo {
	from: { line: number; ch: number };
	to: { line: number; ch: number };
	content: string;
}

/**
 * Smart blank line processing
 * Rules:
 * 1. Blank lines after opening brackets (, [, { → delete
 * 2. Blank lines before closing brackets ), ], } → delete
 * 3. Multiple consecutive blank lines → keep only 1
 */
function smartCleanBlankLines(lines: string[]): string[] {
	const result: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const trimmedLine = line.trim();
		const isBlank = trimmedLine === '';

		if (!isBlank) {
			result.push(line);
			continue;
		}

		// Current line is blank, check context
		const prevLine = result.length > 0 ? (result[result.length - 1] ?? '').trim() : '';
		const nextLine = i + 1 < lines.length ? (lines[i + 1] ?? '').trim() : '';

		// Rule 1: Blank line after opening bracket → delete
		if (prevLine.endsWith('(') || prevLine.endsWith('[') || prevLine.endsWith('{')) {
			continue;
		}

		// Rule 2: Blank line before closing bracket → delete
		if (nextLine.startsWith(')') || nextLine.startsWith(']') || nextLine.startsWith('}')) {
			continue;
		}

		// Rule 3: Consecutive blank lines → keep only 1
		const lastResultLine = result.length > 0 ? (result[result.length - 1] ?? '').trim() : '';
		if (lastResultLine === '') {
			continue; // Previous line is already blank, skip
		}

		result.push(line);
	}

	return result;
}

/**
 * Remove trailing whitespace from each line and apply smart blank line processing
 */
function cleanTrailingWhitespace(text: string): string {
	const lines = text.split('\n').map(line => line.trimEnd());
	return smartCleanBlankLines(lines).join('\n');
}

/**
 * Find the code block at the current cursor position
 */
function getCodeBlockAtCursor(editor: Editor): CodeBlockInfo | null {
	const cursorLine = editor.getCursor().line;
	const content = editor.getValue();
	const lines = content.split('\n');

	// Find all code blocks using line-by-line parsing
	let inCodeBlock = false;
	let codeBlockStart = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const trimmedLine = line.trimStart();

		if (!inCodeBlock && trimmedLine.startsWith('```')) {
			// Start of code block
			inCodeBlock = true;
			codeBlockStart = i;
		} else if (inCodeBlock && trimmedLine.startsWith('```')) {
			// End of code block
			const codeBlockEnd = i;

			// Check if cursor is within this code block
			if (cursorLine >= codeBlockStart && cursorLine <= codeBlockEnd) {
				// Calculate character positions
				const fromCh = 0;
				const endLine = lines[codeBlockEnd] ?? '';
				const toCh = endLine.length;

				// Get the content of the code block (including fences)
				const blockLines = lines.slice(codeBlockStart, codeBlockEnd + 1);
				const blockContent = blockLines.join('\n');

				return {
					from: { line: codeBlockStart, ch: fromCh },
					to: { line: codeBlockEnd, ch: toCh },
					content: blockContent
				};
			}

			inCodeBlock = false;
			codeBlockStart = -1;
		}
	}

	return null;
}

/**
 * Clean trailing whitespace and smart blank lines in a code block while preserving the fence markers
 */
function cleanCodeBlock(content: string): string {
	const lines = content.split('\n');
	if (lines.length < 2) return content;

	// First line is the opening fence (```language)
	const openingFence = lines[0];
	// Last line is the closing fence (```)
	const closingFence = lines[lines.length - 1];
	// Middle lines are the code content
	const codeLines = lines.slice(1, lines.length - 1);

	// 1. Clean trailing whitespace from code lines
	const cleanedLines = codeLines.map(line => line.trimEnd());

	// 2. Smart blank line processing
	const processedLines = smartCleanBlankLines(cleanedLines);

	return [openingFence, ...processedLines, closingFence].join('\n');
}

export default class PasteCodeCleanerPlugin extends Plugin {
	settings: PasteCodeCleanerSettings;

	async onload() {
		await this.loadSettings();

		// Command: Clean Code Block
		this.addCommand({
			id: 'clean-code-block',
			name: 'Clean code block (remove trailing whitespace)',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.cleanCodeBlockCommand(editor);
			}
		});

		// Command: Select Code Block
		this.addCommand({
			id: 'select-code-block',
			name: 'Select code block',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.selectCodeBlockCommand(editor);
			}
		});

		// Add settings tab
		this.addSettingTab(new PasteCodeCleanerSettingTab(this.app, this));

		// Register paste event handler if auto-clean is enabled
		this.registerEvent(
			this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
				if (this.settings.autoCleanOnPaste) {
					this.handlePaste(evt, editor);
				}
			})
		);
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PasteCodeCleanerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Handle the clean code block command
	 */
	private cleanCodeBlockCommand(editor: Editor) {
		// Check if there's selected text
		const selection = editor.getSelection();

		if (selection) {
			// Clean the selected text
			const cleaned = cleanTrailingWhitespace(selection);
			if (cleaned !== selection) {
				editor.replaceSelection(cleaned);
				new Notice('Cleaned trailing whitespace in selection');
			} else {
				new Notice('No trailing whitespace found in selection');
			}
			return;
		}

		// No selection - try to find code block at cursor
		const codeBlock = getCodeBlockAtCursor(editor);

		if (codeBlock) {
			const cleaned = cleanCodeBlock(codeBlock.content);
			if (cleaned !== codeBlock.content) {
				editor.replaceRange(
					cleaned,
					codeBlock.from,
					codeBlock.to
				);
				new Notice('Cleaned trailing whitespace in code block');
			} else {
				new Notice('No trailing whitespace found in code block');
			}
		} else {
			new Notice('Cursor is not inside a code block. Select text or place cursor in a code block.');
		}
	}

	/**
	 * Handle the select code block command
	 */
	private selectCodeBlockCommand(editor: Editor) {
		const codeBlock = getCodeBlockAtCursor(editor);

		if (codeBlock) {
			editor.setSelection(codeBlock.from, codeBlock.to);
			new Notice('Code block selected');
		} else {
			new Notice('Cursor is not inside a code block');
		}
	}

	/**
	 * Handle paste event - auto clean if enabled
	 */
	private handlePaste(evt: ClipboardEvent, editor: Editor) {
		const clipboardData = evt.clipboardData;
		if (!clipboardData) return;

		const text = clipboardData.getData('text/plain');
		if (!text) return;

		// Check if the pasted text has trailing whitespace
		const cleaned = cleanTrailingWhitespace(text);
		if (cleaned !== text) {
			// Prevent default paste
			evt.preventDefault();
			// Insert cleaned text
			editor.replaceSelection(cleaned);
		}
	}
}
