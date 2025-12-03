/**
 * Drive Embedder - Size Presets
 * Intuitive size options for all content types
 */

import { ContentCategory, SizeOption, SupportedFileType } from './types';

/**
 * Size presets per content category
 * Designed for non-developers with intuitive labels
 */
export const SIZE_PRESETS: Record<ContentCategory, SizeOption[]> = {
    video: [
        {
            id: 'compact',
            label: 'Compact',
            icon: '🔹',
            description: 'Good for inline content',
            width: '60%',
            height: '280px'
        },
        {
            id: 'medium',
            label: 'Medium',
            icon: '🔸',
            description: 'Recommended for most use cases',
            width: '80%',
            height: '400px',
            recommended: true
        },
        {
            id: 'large',
            label: 'Large',
            icon: '🔶',
            description: 'For detailed viewing',
            width: '100%',
            height: '500px'
        },
        {
            id: 'fullwidth',
            label: 'Full Width',
            icon: '🟠',
            description: 'Immersive viewing experience',
            width: '100%',
            height: '600px'
        }
    ],
    document: [
        {
            id: 'compact',
            label: 'Compact',
            icon: '🔹',
            description: 'Quick preview',
            width: '70%',
            height: '400px'
        },
        {
            id: 'medium',
            label: 'Medium',
            icon: '🔸',
            description: 'Good for reading documents',
            width: '100%',
            height: '500px',
            recommended: true
        },
        {
            id: 'large',
            label: 'Large',
            icon: '🔶',
            description: 'Comfortable reading',
            width: '100%',
            height: '650px'
        },
        {
            id: 'fullwidth',
            label: 'Full Screen',
            icon: '🟠',
            description: 'Full-screen document viewer',
            width: '100%',
            height: '800px'
        }
    ],
    image: [
        {
            id: 'thumbnail',
            label: 'Thumbnail',
            icon: '🔹',
            description: 'Small preview image',
            width: '200px',
            height: 'auto'
        },
        {
            id: 'compact',
            label: 'Compact',
            icon: '🔸',
            description: 'Suitable for body content',
            width: '400px',
            height: 'auto'
        },
        {
            id: 'medium',
            label: 'Medium',
            icon: '🔶',
            description: 'Good for viewing images',
            width: '600px',
            height: 'auto',
            recommended: true
        },
        {
            id: 'large',
            label: 'Large',
            icon: '🟠',
            description: 'For detailed viewing',
            width: '100%',
            height: 'auto'
        }
    ],
    audio: [
        {
            id: 'slim',
            label: 'Slim',
            icon: '🎵',
            description: 'Minimal space',
            width: '100%',
            height: '100px',
            recommended: true
        },
        {
            id: 'standard',
            label: 'Standard',
            icon: '🎶',
            description: 'With some padding',
            width: '100%',
            height: '120px'
        }
    ]
};

/**
 * Supported file types with their categories and metadata
 */
export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
    // Video
    { extension: '.mp4', mimeType: 'video/mp4', category: 'video', icon: '🎬', label: 'MP4 Video' },
    { extension: '.webm', mimeType: 'video/webm', category: 'video', icon: '🎬', label: 'WebM Video' },
    { extension: '.mov', mimeType: 'video/quicktime', category: 'video', icon: '🎬', label: 'QuickTime Video' },
    { extension: '.avi', mimeType: 'video/x-msvideo', category: 'video', icon: '🎬', label: 'AVI Video' },

    // Audio
    { extension: '.mp3', mimeType: 'audio/mpeg', category: 'audio', icon: '🎵', label: 'MP3 Audio' },
    { extension: '.wav', mimeType: 'audio/wav', category: 'audio', icon: '🎵', label: 'WAV Audio' },
    { extension: '.ogg', mimeType: 'audio/ogg', category: 'audio', icon: '🎵', label: 'OGG Audio' },
    { extension: '.m4a', mimeType: 'audio/mp4', category: 'audio', icon: '🎵', label: 'M4A Audio' },

    // Document
    { extension: '.pdf', mimeType: 'application/pdf', category: 'document', icon: '📄', label: 'PDF Document' },

    // Image
    { extension: '.jpg', mimeType: 'image/jpeg', category: 'image', icon: '🖼️', label: 'JPEG Image' },
    { extension: '.jpeg', mimeType: 'image/jpeg', category: 'image', icon: '🖼️', label: 'JPEG Image' },
    { extension: '.png', mimeType: 'image/png', category: 'image', icon: '🖼️', label: 'PNG Image' },
    { extension: '.gif', mimeType: 'image/gif', category: 'image', icon: '🖼️', label: 'GIF Image' },
    { extension: '.webp', mimeType: 'image/webp', category: 'image', icon: '🖼️', label: 'WebP Image' },
    { extension: '.svg', mimeType: 'image/svg+xml', category: 'image', icon: '🖼️', label: 'SVG Image' }
];

/**
 * Get file type info from filename
 */
export function getFileTypeInfo(fileName: string): SupportedFileType | null {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return SUPPORTED_FILE_TYPES.find(ft => ft.extension === ext) || null;
}

/**
 * Get size presets for a category
 */
export function getSizePresets(category: ContentCategory): SizeOption[] {
    return SIZE_PRESETS[category] || SIZE_PRESETS.document;
}

/**
 * Get recommended size for a category
 */
export function getRecommendedSize(category: ContentCategory): SizeOption {
    const presets = getSizePresets(category);
    return presets.find(p => p.recommended) || presets[0];
}

/**
 * Get size by ID for a category
 */
export function getSizeById(category: ContentCategory, sizeId: string): SizeOption {
    const presets = getSizePresets(category);
    return presets.find(p => p.id === sizeId) || getRecommendedSize(category);
}

/**
 * Check if file is supported
 */
export function isFileSupported(fileName: string): boolean {
    return getFileTypeInfo(fileName) !== null;
}

/**
 * Get supported extensions as string for file input
 */
export function getSupportedExtensions(): string {
    return SUPPORTED_FILE_TYPES.map(ft => ft.extension).join(',');
}

/**
 * Supported extensions array for file input accept attribute
 */
export const SUPPORTED_EXTENSIONS: string[] = SUPPORTED_FILE_TYPES.map(ft => ft.extension);

/**
 * Get category icon
 */
export function getCategoryIcon(category: ContentCategory): string {
    const icons: Record<ContentCategory, string> = {
        video: '🎬',
        audio: '🎵',
        document: '📄',
        image: '🖼️'
    };
    return icons[category];
}

/**
 * Get category label
 */
export function getCategoryLabel(category: ContentCategory): string {
    const labels: Record<ContentCategory, string> = {
        video: 'Video',
        audio: 'Audio',
        document: 'Document',
        image: 'Image'
    };
    return labels[category];
}
