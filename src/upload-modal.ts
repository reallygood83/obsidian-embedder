/**
 * Drive Embedder - Upload Modal
 * File picker and size selector UI
 */

import { Modal, App, Notice, Setting } from 'obsidian';
import { ContentCategory, SizeOption, UploadProgress, DriveUploadResult, EmbedOptions } from './types';
import { getFileTypeInfo, getSizePresets, getRecommendedSize, isFileSupported, SUPPORTED_EXTENSIONS } from './size-presets';
import { GoogleDriveUploader } from './uploader';

export interface UploadModalResult {
    file: File;
    uploadResult: DriveUploadResult;
    embedOptions: EmbedOptions;
}

export class UploadModal extends Modal {
    private uploader: GoogleDriveUploader;
    private driveFolder: string;
    private onComplete: (result: UploadModalResult) => void;

    private selectedFile: File | null = null;
    private selectedSize: SizeOption | null = null;
    private fileCategory: ContentCategory | null = null;
    private showTitle: boolean = true;

    // UI Elements
    private fileInputEl: HTMLInputElement | null = null;
    private fileInfoEl: HTMLElement | null = null;
    private sizeOptionsEl: HTMLElement | null = null;
    private progressEl: HTMLElement | null = null;
    private uploadBtn: HTMLButtonElement | null = null;

    constructor(
        app: App,
        uploader: GoogleDriveUploader,
        driveFolder: string,
        defaultShowTitle: boolean,
        onComplete: (result: UploadModalResult) => void
    ) {
        super(app);
        this.uploader = uploader;
        this.driveFolder = driveFolder;
        this.showTitle = defaultShowTitle;
        this.onComplete = onComplete;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('drive-embedder-modal');

        // Modal Header
        contentEl.createEl('h2', {
            text: '📁 Drive Embedder',
            cls: 'drive-embedder-title'
        });

        contentEl.createEl('p', {
            text: 'Upload files to Google Drive and generate embed code.',
            cls: 'drive-embedder-subtitle'
        });

        // File Selection Section
        this.createFileSection(contentEl);

        // File Info Display (hidden initially)
        this.fileInfoEl = contentEl.createDiv({ cls: 'drive-embedder-file-info hidden' });

        // Size Options Section (hidden initially)
        this.sizeOptionsEl = contentEl.createDiv({ cls: 'drive-embedder-size-options hidden' });

        // Title Toggle
        this.createTitleToggle(contentEl);

        // Progress Section (hidden initially)
        this.progressEl = contentEl.createDiv({ cls: 'drive-embedder-progress hidden' });

        // Action Buttons
        this.createActionButtons(contentEl);

        // Supported formats info
        this.createSupportedFormatsInfo(contentEl);
    }

    private createFileSection(container: HTMLElement) {
        const section = container.createDiv({ cls: 'drive-embedder-section' });

        // Hidden file input
        this.fileInputEl = section.createEl('input', {
            type: 'file',
            cls: 'drive-embedder-file-input'
        });
        this.fileInputEl.accept = SUPPORTED_EXTENSIONS.join(',');
        this.fileInputEl.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drop zone
        const dropZone = section.createDiv({ cls: 'drive-embedder-dropzone' });
        dropZone.innerHTML = `
            <div class="dropzone-content">
                <span class="dropzone-icon">📂</span>
                <p class="dropzone-text">Drag files here or</p>
                <button class="dropzone-btn">Select File</button>
            </div>
        `;

        // Click to select
        const selectBtn = dropZone.querySelector('.dropzone-btn');
        selectBtn?.addEventListener('click', () => this.fileInputEl?.click());

        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.addClass('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.removeClass('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.removeClass('dragover');
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                this.processFile(files[0]);
            }
        });
    }

    private handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.processFile(file);
        }
    }

    private processFile(file: File) {
        // Check if file type is supported
        const fileInfo = getFileTypeInfo(file.name);
        if (!fileInfo) {
            new Notice('Unsupported file type.');
            return;
        }

        this.selectedFile = file;
        this.fileCategory = fileInfo.category;

        // Update file info display
        this.updateFileInfo(file, fileInfo);

        // Show size options
        this.updateSizeOptions(fileInfo.category);

        // Enable upload button
        if (this.uploadBtn) {
            this.uploadBtn.disabled = false;
        }
    }

    private updateFileInfo(file: File, fileInfo: { category: ContentCategory; icon: string; label: string }) {
        if (!this.fileInfoEl) return;

        this.fileInfoEl.empty();
        this.fileInfoEl.removeClass('hidden');

        const infoCard = this.fileInfoEl.createDiv({ cls: 'file-info-card' });

        // File icon and name
        const fileHeader = infoCard.createDiv({ cls: 'file-header' });
        fileHeader.createSpan({ text: fileInfo.icon, cls: 'file-icon' });
        fileHeader.createSpan({ text: file.name, cls: 'file-name' });

        // File details
        const fileDetails = infoCard.createDiv({ cls: 'file-details' });
        fileDetails.createSpan({ text: `Type: ${fileInfo.label}`, cls: 'file-type' });
        fileDetails.createSpan({ text: `Size: ${this.formatFileSize(file.size)}`, cls: 'file-size' });
    }

    private updateSizeOptions(category: ContentCategory) {
        if (!this.sizeOptionsEl) return;

        this.sizeOptionsEl.empty();
        this.sizeOptionsEl.removeClass('hidden');

        const presets = getSizePresets(category);
        const recommended = getRecommendedSize(category);

        // Section title
        this.sizeOptionsEl.createEl('h4', {
            text: '📐 Select Embed Size',
            cls: 'size-section-title'
        });

        // Size options grid
        const optionsGrid = this.sizeOptionsEl.createDiv({ cls: 'size-options-grid' });

        presets.forEach((preset) => {
            const option = optionsGrid.createDiv({
                cls: `size-option ${preset.id === recommended?.id ? 'recommended' : ''}`
            });

            option.innerHTML = `
                <span class="size-icon">${preset.icon}</span>
                <span class="size-label">${preset.label}</span>
                <span class="size-desc">${preset.description}</span>
                ${preset.recommended ? '<span class="recommended-badge">Recommended</span>' : ''}
            `;

            // Select default (recommended)
            if (preset.id === recommended?.id) {
                option.addClass('selected');
                this.selectedSize = preset;
            }

            option.addEventListener('click', () => {
                // Remove selection from all
                optionsGrid.querySelectorAll('.size-option').forEach(el =>
                    el.removeClass('selected')
                );
                // Select this one
                option.addClass('selected');
                this.selectedSize = preset;
            });
        });
    }

    private createTitleToggle(container: HTMLElement) {
        const toggleSection = container.createDiv({ cls: 'drive-embedder-toggle-section' });

        new Setting(toggleSection)
            .setName('Show filename')
            .setDesc('Display filename above the embed')
            .addToggle(toggle => toggle
                .setValue(this.showTitle)
                .onChange(value => {
                    this.showTitle = value;
                })
            );
    }

    private createActionButtons(container: HTMLElement) {
        const buttonContainer = container.createDiv({ cls: 'drive-embedder-buttons' });

        // Cancel button
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'drive-embedder-btn cancel'
        });
        cancelBtn.addEventListener('click', () => this.close());

        // Upload button
        this.uploadBtn = buttonContainer.createEl('button', {
            text: '📤 Upload & Embed',
            cls: 'drive-embedder-btn primary'
        });
        this.uploadBtn.disabled = true;
        this.uploadBtn.addEventListener('click', () => this.handleUpload());
    }

    private createSupportedFormatsInfo(container: HTMLElement) {
        const infoSection = container.createDiv({ cls: 'drive-embedder-formats-info' });

        infoSection.innerHTML = `
            <details>
                <summary>Supported File Formats</summary>
                <div class="formats-grid">
                    <div class="format-group">
                        <span class="format-icon">🎬</span>
                        <span class="format-label">Video</span>
                        <span class="format-types">MP4, WebM, MOV, AVI</span>
                    </div>
                    <div class="format-group">
                        <span class="format-icon">🎵</span>
                        <span class="format-label">Audio</span>
                        <span class="format-types">MP3, WAV, OGG, M4A</span>
                    </div>
                    <div class="format-group">
                        <span class="format-icon">📄</span>
                        <span class="format-label">Document</span>
                        <span class="format-types">PDF</span>
                    </div>
                    <div class="format-group">
                        <span class="format-icon">🖼️</span>
                        <span class="format-label">Image</span>
                        <span class="format-types">JPG, PNG, GIF, WebP, SVG</span>
                    </div>
                </div>
            </details>
        `;
    }

    private async handleUpload() {
        if (!this.selectedFile || !this.selectedSize) {
            new Notice('Please select a file and size.');
            return;
        }

        // Disable upload button
        if (this.uploadBtn) {
            this.uploadBtn.disabled = true;
            this.uploadBtn.textContent = 'Uploading...';
        }

        // Show progress
        this.showProgress();

        try {
            const result = await this.uploader.uploadFile(
                this.selectedFile,
                this.driveFolder,
                (progress) => this.updateProgress(progress)
            );

            if (!result) {
                throw new Error('Failed to receive upload result.');
            }

            // Success!
            new Notice('✅ Upload complete! Embed code generated.');

            this.onComplete({
                file: this.selectedFile,
                uploadResult: result,
                embedOptions: {
                    size: this.selectedSize!,
                    showTitle: this.showTitle
                }
            });

            this.close();
        } catch (error: any) {
            console.error('Upload failed:', error);
            new Notice(`❌ Upload failed: ${error.message}`);

            // Re-enable upload button
            if (this.uploadBtn) {
                this.uploadBtn.disabled = false;
                this.uploadBtn.textContent = '📤 Upload & Embed';
            }

            this.hideProgress();
        }
    }

    private showProgress() {
        if (!this.progressEl) return;

        this.progressEl.empty();
        this.progressEl.removeClass('hidden');

        this.progressEl.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span class="progress-status">Preparing...</span>
                    <span class="progress-percent">0%</span>
                </div>
            </div>
        `;
    }

    private updateProgress(progress: UploadProgress) {
        if (!this.progressEl) return;

        const fillEl = this.progressEl.querySelector('.progress-fill') as HTMLElement;
        const statusEl = this.progressEl.querySelector('.progress-status');
        const percentEl = this.progressEl.querySelector('.progress-percent');

        if (fillEl) {
            fillEl.style.width = `${progress.progress}%`;
        }

        if (statusEl) {
            statusEl.textContent = progress.message;
        }

        if (percentEl) {
            percentEl.textContent = `${Math.round(progress.progress)}%`;
        }
    }

    private hideProgress() {
        if (this.progressEl) {
            this.progressEl.addClass('hidden');
        }
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
