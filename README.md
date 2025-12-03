# Drive Embedder

Upload local files to Google Drive and embed them directly in your Obsidian notes with intuitive Korean size options.

## Features

- 🚀 **One-Click Upload**: Upload files directly to Google Drive from Obsidian
- 🔗 **Auto Embed Generation**: Automatically creates embed code for your notes
- 📐 **Intuitive Size Options**: Korean labels like "아담하게", "적당히 크게", "크게", "아주 크게"
- 🎵 **Audio Optimized**: Special compact sizes for audio files ("슬림", "표준")
- 📂 **Multi-Format Support**: Video (MP4, WebM, MOV, AVI), Audio (MP3, WAV, OGG, M4A), PDF, Images (JPG, PNG, GIF, WebP, SVG)
- 🔄 **Real-Time Progress**: Visual upload progress tracking
- 🎨 **Beautiful UI**: Clean, intuitive interface with Korean language support

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
4. Click "연결하기" (Connect)
5. Follow the browser authorization flow
6. Grant permissions to your Google Drive

## Usage

### Upload and Embed Files

1. Click the cloud upload icon in the ribbon, or
2. Use command palette: "Drive Embedder: 파일 업로드 & 임베드"
3. Select a file or drag & drop
4. Choose your preferred size (intuitive Korean labels)
5. Click "📤 업로드 & 임베드"
6. Embed code is automatically inserted at cursor position

### Size Options

#### Video & Documents
- 🔹 **아담하게** (Compact): Perfect for inline content
- 🔸 **적당히 크게** (Medium): Recommended for most use cases
- 🔶 **크게** (Large): For detailed viewing
- 🟠 **아주 크게** (Full Width): Immersive viewing experience

#### Audio
- 🎵 **슬림** (Slim): Minimal space (54px height)
- 🎶 **표준** (Standard): With padding (80px height)

#### Images
- 🔹 **썸네일** (Thumbnail): 200px width
- 🔸 **아담하게** (Compact): 400px width
- 🔶 **적당히 크게** (Medium): 600px width
- 🟠 **크게** (Large): 100% width

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

### "연결 안됨" (Not Connected)
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

MIT License - feel free to use and modify as needed.

## Support

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/reallygood83/obsidian-embedder/issues).
