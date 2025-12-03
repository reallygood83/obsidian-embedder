/**
 * Drive Embedder - Main Plugin
 * Upload local files to Google Drive and embed them in Obsidian notes
 */

import { Plugin, PluginSettingTab, App, Setting, Notice, Editor, MarkdownView } from 'obsidian';
import { DriveEmbedderSettings } from './src/types';
import { DEFAULT_SETTINGS } from './src/settings';
import { GoogleOAuthFlow } from './src/google-oauth-flow';
import { GoogleDriveUploader } from './src/uploader';
import { UploadModal, UploadModalResult } from './src/upload-modal';
import { EmbedGenerator } from './src/embed-generator';

export default class DriveEmbedderPlugin extends Plugin {
    settings: DriveEmbedderSettings;
    private oauthFlow: GoogleOAuthFlow | null = null;
    private uploader: GoogleDriveUploader | null = null;
    private embedGenerator: EmbedGenerator;

    async onload() {
        await this.loadSettings();

        this.embedGenerator = new EmbedGenerator();

        // Initialize OAuth and uploader if credentials exist
        this.initializeServices();

        // Add ribbon icon
        this.addRibbonIcon('cloud-upload', 'Drive Embedder: Upload File', () => {
            this.openUploadModal();
        });

        // Add command
        this.addCommand({
            id: 'upload-and-embed',
            name: 'Upload File & Embed',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.openUploadModal(editor);
            }
        });

        // Add settings tab
        this.addSettingTab(new DriveEmbedderSettingTab(this.app, this));

        console.log('Drive Embedder loaded');
    }

    onunload() {
        console.log('Drive Embedder unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.initializeServices();
    }

    private initializeServices() {
        if (this.settings.googleClientId && this.settings.googleClientSecret) {
            this.oauthFlow = new GoogleOAuthFlow({
                clientId: this.settings.googleClientId,
                clientSecret: this.settings.googleClientSecret,
                redirectPort: 8586
            });

            if (this.settings.googleAccessToken) {
                this.uploader = new GoogleDriveUploader({
                    clientId: this.settings.googleClientId,
                    clientSecret: this.settings.googleClientSecret,
                    accessToken: this.settings.googleAccessToken,
                    refreshToken: this.settings.googleRefreshToken,
                    tokenExpiresAt: this.settings.tokenExpiresAt,
                    onTokenRefresh: async (tokens) => {
                        this.settings.googleAccessToken = tokens.accessToken;
                        this.settings.googleRefreshToken = tokens.refreshToken;
                        this.settings.tokenExpiresAt = tokens.expiresAt;
                        await this.saveSettings();
                    }
                });
            }
        }
    }

    async startOAuthFlow(): Promise<boolean> {
        if (!this.oauthFlow) {
            new Notice('Please enter Google OAuth settings first.');
            return false;
        }

        try {
            const tokens = await this.oauthFlow.startOAuthFlow();

            this.settings.googleAccessToken = tokens.accessToken;
            this.settings.googleRefreshToken = tokens.refreshToken;
            this.settings.tokenExpiresAt = tokens.expiresAt;
            await this.saveSettings();

            new Notice('✅ Google Drive connected successfully!');
            return true;
        } catch (error: any) {
            console.error('OAuth flow failed:', error);
            new Notice(`❌ Connection failed: ${error.message}`);
            return false;
        }
    }

    async disconnectGoogleDrive() {
        this.settings.googleAccessToken = '';
        this.settings.googleRefreshToken = '';
        this.settings.tokenExpiresAt = 0;
        this.uploader = null;
        await this.saveSettings();
        new Notice('Google Drive disconnected.');
    }

    isConnected(): boolean {
        return !!this.settings.googleAccessToken && !!this.uploader;
    }

    private openUploadModal(editor?: Editor) {
        if (!this.isConnected()) {
            new Notice('Please connect to Google Drive first. (Connect in settings)');
            return;
        }

        if (!this.uploader) {
            new Notice('Uploader initialization failed. Please check settings.');
            return;
        }

        new UploadModal(
            this.app,
            this.uploader,
            this.settings.driveFolder,
            this.settings.showTitleByDefault,
            async (result: UploadModalResult) => {
                const embedCode = this.embedGenerator.generateEmbed(
                    result.file.name,
                    result.uploadResult,
                    result.embedOptions
                );

                if (editor) {
                    // Insert at cursor position
                    editor.replaceSelection(embedCode);
                } else {
                    // Copy to clipboard
                    await navigator.clipboard.writeText(embedCode);
                    new Notice('📋 Embed code copied to clipboard!');
                }
            }
        ).open();
    }
}

class DriveEmbedderSettingTab extends PluginSettingTab {
    plugin: DriveEmbedderPlugin;

    constructor(app: App, plugin: DriveEmbedderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Drive Embedder Settings' });

        // Connection status
        this.createConnectionSection(containerEl);

        // OAuth Settings
        this.createOAuthSection(containerEl);

        // Drive Settings
        this.createDriveSection(containerEl);

        // Embed Settings
        this.createEmbedSection(containerEl);

        // Help section
        this.createHelpSection(containerEl);
    }

    private createConnectionSection(containerEl: HTMLElement) {
        const connectionDiv = containerEl.createDiv({ cls: 'drive-embedder-connection-section' });

        const isConnected = this.plugin.isConnected();

        connectionDiv.createEl('h3', { text: 'Connection Status' });

        const statusDiv = connectionDiv.createDiv({ cls: 'connection-status' });
        statusDiv.innerHTML = isConnected
            ? '<span class="status-connected">✅ Google Drive Connected</span>'
            : '<span class="status-disconnected">❌ Not Connected</span>';

        if (isConnected) {
            new Setting(connectionDiv)
                .setName('Disconnect')
                .setDesc('Disconnect from Google Drive')
                .addButton(button => button
                    .setButtonText('Disconnect')
                    .setWarning()
                    .onClick(async () => {
                        await this.plugin.disconnectGoogleDrive();
                        this.display();
                    })
                );
        } else {
            new Setting(connectionDiv)
                .setName('Connect to Google Drive')
                .setDesc('Enter OAuth settings below, then click the Connect button')
                .addButton(button => button
                    .setButtonText('Connect')
                    .setCta()
                    .onClick(async () => {
                        const success = await this.plugin.startOAuthFlow();
                        if (success) {
                            this.display();
                        }
                    })
                );
        }
    }

    private createOAuthSection(containerEl: HTMLElement) {
        containerEl.createEl('h3', { text: 'Google OAuth Settings' });

        new Setting(containerEl)
            .setName('Client ID')
            .setDesc('OAuth Client ID generated from Google Cloud Console')
            .addText(text => text
                .setPlaceholder('xxx.apps.googleusercontent.com')
                .setValue(this.plugin.settings.googleClientId)
                .onChange(async (value) => {
                    this.plugin.settings.googleClientId = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Client Secret')
            .setDesc('OAuth Client Secret generated from Google Cloud Console')
            .addText(text => text
                .setPlaceholder('GOCSPX-...')
                .setValue(this.plugin.settings.googleClientSecret)
                .onChange(async (value) => {
                    this.plugin.settings.googleClientSecret = value;
                    await this.plugin.saveSettings();
                })
            );
    }

    private createDriveSection(containerEl: HTMLElement) {
        containerEl.createEl('h3', { text: 'Google Drive Settings' });

        new Setting(containerEl)
            .setName('Upload Folder')
            .setDesc('Google Drive folder path for uploaded files')
            .addText(text => text
                .setPlaceholder('Obsidian/DriveEmbedder')
                .setValue(this.plugin.settings.driveFolder)
                .onChange(async (value) => {
                    this.plugin.settings.driveFolder = value;
                    await this.plugin.saveSettings();
                })
            );
    }

    private createEmbedSection(containerEl: HTMLElement) {
        containerEl.createEl('h3', { text: 'Embed Settings' });

        new Setting(containerEl)
            .setName('Show Filename by Default')
            .setDesc('Display filename in embed code by default')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTitleByDefault)
                .onChange(async (value) => {
                    this.plugin.settings.showTitleByDefault = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Default Theme')
            .setDesc('Default embed theme (auto-detects system theme)')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto (System Theme)')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.defaultTheme)
                .onChange(async (value: 'auto' | 'light' | 'dark') => {
                    this.plugin.settings.defaultTheme = value;
                    await this.plugin.saveSettings();
                })
            );

        containerEl.createEl('h4', { text: 'Default Embed Size' });

        new Setting(containerEl)
            .setName('Default Video Size')
            .addDropdown(dropdown => dropdown
                .addOption('compact', 'Compact')
                .addOption('medium', 'Medium')
                .addOption('large', 'Large')
                .addOption('fullwidth', 'Full Width')
                .setValue(this.plugin.settings.defaultVideoSize)
                .onChange(async (value) => {
                    this.plugin.settings.defaultVideoSize = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Default Audio Size')
            .addDropdown(dropdown => dropdown
                .addOption('slim', 'Slim')
                .addOption('standard', 'Standard')
                .setValue(this.plugin.settings.defaultAudioSize)
                .onChange(async (value) => {
                    this.plugin.settings.defaultAudioSize = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Default Document Size')
            .addDropdown(dropdown => dropdown
                .addOption('compact', 'Compact')
                .addOption('medium', 'Medium')
                .addOption('large', 'Large')
                .addOption('fullheight', 'Full Height')
                .setValue(this.plugin.settings.defaultDocumentSize)
                .onChange(async (value) => {
                    this.plugin.settings.defaultDocumentSize = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Default Image Size')
            .addDropdown(dropdown => dropdown
                .addOption('small', 'Small')
                .addOption('medium', 'Medium')
                .addOption('large', 'Large')
                .addOption('original', 'Original Size')
                .setValue(this.plugin.settings.defaultImageSize)
                .onChange(async (value) => {
                    this.plugin.settings.defaultImageSize = value;
                    await this.plugin.saveSettings();
                })
            );
    }

    private createHelpSection(containerEl: HTMLElement) {
        containerEl.createEl('h3', { text: 'Help' });

        const helpDiv = containerEl.createDiv({ cls: 'drive-embedder-help' });

        helpDiv.innerHTML = `
            <details>
                <summary><strong>📋 How to Set Up Google OAuth</strong></summary>
                <ol>
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Go to APIs & Services → OAuth consent screen and configure</li>
                    <li>Go to APIs & Services → Credentials → Create Credentials → OAuth Client ID</li>
                    <li>Select Application type: Desktop app</li>
                    <li>Enter the generated Client ID and Client Secret in the settings above</li>
                    <li>Enable Google Drive API</li>
                </ol>
            </details>

            <details>
                <summary><strong>🎬 Supported File Formats</strong></summary>
                <ul>
                    <li><strong>Video:</strong> MP4, WebM, MOV, AVI</li>
                    <li><strong>Audio:</strong> MP3, WAV, OGG, M4A</li>
                    <li><strong>Document:</strong> PDF</li>
                    <li><strong>Image:</strong> JPG, PNG, GIF, WebP, SVG</li>
                </ul>
            </details>

            <details>
                <summary><strong>📐 Embed Size Guide</strong></summary>
                <ul>
                    <li><strong>Compact:</strong> Good size for inline content</li>
                    <li><strong>Medium:</strong> Suitable for general viewing (Recommended)</li>
                    <li><strong>Large:</strong> When detailed view is needed</li>
                    <li><strong>Full Width:</strong> Immersive full-width display</li>
                </ul>
            </details>

            <details>
                <summary><strong>🔗 How to Use</strong></summary>
                <ol>
                    <li>Click the cloud icon in the sidebar or search "Drive Embedder" in the command palette</li>
                    <li>Select a file (drag & drop or use the file picker button)</li>
                    <li>Choose your desired embed size</li>
                    <li>Click the "Upload & Embed" button</li>
                    <li>The embed code will be automatically inserted after upload</li>
                </ol>
            </details>
        `;
    }
}
