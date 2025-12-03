/**
 * Drive Embedder - Embed Code Generator
 * Generates embed code based on file type and size options
 */

import { ContentCategory, SizeOption, DriveUploadResult, EmbedOptions } from './types';
import { getFileTypeInfo } from './size-presets';

export class EmbedGenerator {
    /**
     * Generate embed code for a file uploaded to Google Drive
     */
    generateEmbed(
        fileName: string,
        uploadResult: DriveUploadResult,
        options: EmbedOptions
    ): string {
        const fileInfo = getFileTypeInfo(fileName);
        const { size, showTitle } = options;

        let embedCode = '';

        // Add title if enabled
        if (showTitle) {
            embedCode += `**📁 ${fileName}**\n\n`;
        }

        // Generate embed based on category
        if (!fileInfo) {
            embedCode += this.generateGenericEmbed(uploadResult);
            return embedCode;
        }

        switch (fileInfo.category) {
            case 'video':
                embedCode += this.generateVideoEmbed(uploadResult, size);
                break;
            case 'audio':
                embedCode += this.generateAudioEmbed(uploadResult, size);
                break;
            case 'document':
                embedCode += this.generateDocumentEmbed(uploadResult, size);
                break;
            case 'image':
                embedCode += this.generateImageEmbed(uploadResult, size, fileName);
                break;
            default:
                embedCode += this.generateGenericEmbed(uploadResult);
        }

        return embedCode;
    }

    /**
     * Generate video embed (HTML5 video with direct content URL)
     */
    private generateVideoEmbed(result: DriveUploadResult, size: SizeOption): string {
        // Always use direct download URL with correct parameter order
        const videoUrl = `https://drive.google.com/uc?export=download&id=${result.fileId}`;

        return `<div style="width: ${size.width}; margin: 0 auto;">
<video
    src="${videoUrl}"
    width="100%"
    height="${size.height}"
    controls
    preload="metadata"
    style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); background-color: #000;">
    브라우저가 비디오를 지원하지 않습니다.
</video>
</div>`;
    }

    /**
     * Generate audio embed (HTML5 audio with direct content URL)
     */
    private generateAudioEmbed(result: DriveUploadResult, size: SizeOption): string {
        // Always use direct download URL with correct parameter order
        const audioUrl = `https://drive.google.com/uc?export=download&id=${result.fileId}`;

        return `<div style="width: ${size.width}; margin: 0 auto;">
<audio
    src="${audioUrl}"
    controls
    preload="metadata"
    style="width: 100%; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    브라우저가 오디오를 지원하지 않습니다.
</audio>
</div>`;
    }

    /**
     * Generate document embed (iframe for PDF viewer)
     */
    private generateDocumentEmbed(result: DriveUploadResult, size: SizeOption): string {
        const previewUrl = `https://drive.google.com/file/d/${result.fileId}/preview`;

        return `<div style="width: ${size.width}; margin: 0 auto;">
<iframe
    src="${previewUrl}"
    width="100%"
    height="${size.height}"
    frameborder="0"
    style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
</iframe>
</div>`;
    }

    /**
     * Generate image embed (direct image with thumbnail URL)
     */
    private generateImageEmbed(result: DriveUploadResult, size: SizeOption, fileName: string): string {
        // Use direct thumbnail URL for images
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${result.fileId}&sz=w1000`;
        const viewUrl = result.webViewLink;

        return `<div style="width: ${size.width}; margin: 0 auto; text-align: center;">
<a href="${viewUrl}" target="_blank">
<img
    src="${thumbnailUrl}"
    alt="${fileName}"
    style="max-width: 100%; height: ${size.height}; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer;"
/>
</a>
</div>`;
    }

    /**
     * Generate generic embed (link only)
     */
    private generateGenericEmbed(result: DriveUploadResult): string {
        return `[📎 파일 열기](${result.webViewLink})`;
    }

    /**
     * Generate markdown link format
     */
    generateMarkdownLink(fileName: string, result: DriveUploadResult): string {
        return `[${fileName}](${result.webViewLink})`;
    }

    /**
     * Generate all embed formats for user to choose
     */
    generateAllFormats(
        fileName: string,
        uploadResult: DriveUploadResult,
        options: EmbedOptions
    ): {
        embed: string;
        link: string;
        directLink: string;
    } {
        return {
            embed: this.generateEmbed(fileName, uploadResult, options),
            link: this.generateMarkdownLink(fileName, uploadResult),
            directLink: uploadResult.webViewLink
        };
    }
}
