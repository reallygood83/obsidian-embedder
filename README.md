# Drive Embedder

Upload local files to Google Drive and embed them directly in your Obsidian notes with intuitive size options.

## Features

- 🚀 **One-Click Upload**: Upload files directly to Google Drive from Obsidian
- 🔗 **Auto Embed Generation**: Automatically creates embed code for your notes
- 📐 **Intuitive Size Options**: Clear size labels like "Compact", "Medium", "Large", "Full Width"
- 🎵 **Audio Optimized**: Special compact sizes for audio files ("Slim", "Standard")
- 📂 **Multi-Format Support**: Video (MP4, WebM, MOV, AVI), Audio (MP3, WAV, OGG, M4A), PDF, Images (JPG, PNG, GIF, WebP, SVG)
- 🔄 **Real-Time Progress**: Visual upload progress tracking
- 🎨 **Beautiful UI**: Clean, intuitive interface with worldwide language support

## Installation via BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open Obsidian Settings → BRAT → Add Beta plugin
3. Enter this repository URL: `reallygood83/obsidian-embedder`
4. Click "Add Plugin"
5. Enable "Drive Embedder" in Settings → Community plugins

## Google OAuth Setup

Before using the plugin, you need to set up Google OAuth credentials:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable **Google Drive API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields:
   - App name: "Drive Embedder"
   - User support email: Your email
   - Developer contact: Your email
4. Add scope: `https://www.googleapis.com/auth/drive.file`
5. Save and continue

### 3. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth Client ID"
3. Application type: **Desktop app**
4. Name: "Drive Embedder"
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### 4. Configure Plugin

1. Open Obsidian Settings → Drive Embedder
2. Paste your **Client ID**
3. Paste your **Client Secret**
4. Click "Connect"
5. Follow the browser authorization flow
6. Grant permissions to your Google Drive

## Usage

### Upload and Embed Files

1. Click the cloud upload icon in the ribbon, or
2. Use command palette: "Drive Embedder: Upload File & Embed"
3. Select a file or drag & drop
4. Choose your preferred size (intuitive size labels)
5. Click "Upload & Embed"
6. Embed code is automatically inserted at cursor position

### Size Options

#### Video & Documents
- 🔹 **Compact**: Perfect for inline content
- 🔸 **Medium**: Recommended for most use cases
- 🔶 **Large**: For detailed viewing
- 🟠 **Full Width**: Immersive viewing experience

#### Audio
- 🎵 **Slim**: Minimal space (100px height)
- 🎶 **Standard**: With padding (120px height)

#### Images
- 🔹 **Small**: 300px width
- 🔸 **Medium**: 500px width
- 🔶 **Large**: 800px width
- 🟠 **Original Size**: Full resolution

## Settings

- **Google OAuth**: Client ID and Client Secret
- **Drive Folder**: Upload destination path (default: `Obsidian/DriveEmbedder`)
- **Show Title**: Display filename above embed by default
- **Default Theme**: Auto-detect system theme or force light/dark
- **Default Sizes**: Set preferred sizes for each content type

## Supported File Types

| Category | Formats |
|----------|---------|
| 🎬 Video | MP4, WebM, MOV, AVI |
| 🎵 Audio | MP3, WAV, OGG, M4A |
| 📄 Document | PDF |
| 🖼️ Image | JPG, PNG, GIF, WebP, SVG |

## Security & Privacy

- Your files are uploaded to **your own Google Drive**
- OAuth tokens are stored locally in Obsidian
- No third-party servers involved
- Files are set to public sharing (required for embedding)

## Troubleshooting

### "Not Connected"
- Verify Client ID and Client Secret are correct
- Ensure Google Drive API is enabled
- Check OAuth consent screen is configured

### Upload Fails
- Check internet connection
- Verify Google Drive has sufficient storage
- Try disconnecting and reconnecting

### Token Expired
- Plugin automatically refreshes tokens
- If issues persist, disconnect and reconnect

## Version History

### v1.0.7 (2025-12-03)
- **🌍 Complete Internationalization**: All user-facing text converted to English for worldwide distribution
- **📝 Updated Interface**: Settings, modals, notices, and help documentation now in English
- **📜 License Change**: Changed from MIT to Proprietary Non-Commercial License
- **🌐 Global Ready**: Plugin prepared for official Obsidian community plugin registry
- No functionality changes - all features work exactly as before

### v1.0.6 (2025-12-03)
- **Audio Player Fix**: Increased audio embed height for proper Google Drive player display
- Changed audio heights: 슬림 (54px → 100px), 표준 (80px → 120px)
- Google Drive audio player now displays correctly with all controls visible
- Matches Google Drive's native audio player interface requirements

### v1.0.5 (2025-12-03)
- **Major Fix**: Switched to iframe-based embed for video/audio
- Resolved large file playback issues (files > 25MB)
- Now uses Google Drive's native player via `/preview` URL
- Eliminates virus scan redirect issues with direct download URLs
- Improved compatibility with all file sizes
- More stable playback in Obsidian share notes

### v1.0.4 (2025-12-03)
- **Critical Fix**: Corrected Google Drive URL parameter order
- Fixed URL format from `?id=...&export=download` to `?export=download&id=...`
- Videos and audio now play correctly without webContentLink dependency
- Eliminated URL format inconsistencies

### v1.0.3 (2025-12-03)
- **Fixed**: Video/audio embed now uses HTML5 tags for immediate playback
- **Fixed**: Eliminated "video still processing" error from Google Drive
- **Improved**: Direct content URL embedding for faster media loading
- Videos and audio files now play instantly without Google Drive processing delay

### v1.0.0 (2025-01-25)
- Initial release
- Google Drive upload with OAuth 2.0
- Intuitive Korean size labels
- Multi-format support (video, audio, PDF, images)
- Auto embed code generation
- Real-time upload progress

## Development

```bash
# Clone repository
git clone https://github.com/reallygood83/obsidian-embedder.git

# Install dependencies
npm install

# Build plugin
npm run build

# Development mode
npm run dev
```

## Credits

Developed by [reallygood83](https://github.com/reallygood83)

## License

Proprietary Non-Commercial License

Copyright (c) 2025 reallygood83. All rights reserved.

This software is licensed for personal, educational, and non-commercial use only. Commercial use, distribution for profit, or any revenue-generating activities are strictly prohibited without explicit permission from the copyright holder.

For full license terms, see the [LICENSE](LICENSE) file.

For commercial licensing inquiries, please contact reallygood83.

## Support

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/reallygood83/obsidian-embedder/issues).
