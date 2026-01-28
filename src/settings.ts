import { App, PluginSettingTab, Setting } from 'obsidian';
import PasteCodeCleanerPlugin from './main';

export interface PasteCodeCleanerSettings {
	autoCleanOnPaste: boolean;
}

export const DEFAULT_SETTINGS: PasteCodeCleanerSettings = {
	autoCleanOnPaste: false
};

export class PasteCodeCleanerSettingTab extends PluginSettingTab {
	plugin: PasteCodeCleanerPlugin;

	constructor(app: App, plugin: PasteCodeCleanerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Paste Code Cleaner Settings' });

		new Setting(containerEl)
			.setName('Auto-clean on paste')
			.setDesc('Automatically remove trailing whitespace when pasting text. This applies to all pasted content, not just code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCleanOnPaste)
				.onChange(async (value) => {
					this.plugin.settings.autoCleanOnPaste = value;
					await this.plugin.saveSettings();
				}));
	}
}
