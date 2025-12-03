/**
 * Google Drive Uploader with Progress Tracking
 * Handles file upload, permission setting, and token management
 */
import { requestUrl, Notice } from 'obsidian';
import { GoogleOAuthFlow } from './google-oauth-flow';
import { OAuthTokens, DriveUploadResult, UploadProgress } from './types';

export interface GoogleDriveConfig {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: number;
    onTokenRefresh?: (tokens: OAuthTokens) => Promise<void>;
}

export class GoogleDriveUploader {
    private readonly API_URL = 'https://www.googleapis.com/drive/v3';
    private readonly UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
    private readonly REDIRECT_PORT = 8586;

    private config: GoogleDriveConfig;
    private oauthFlow: GoogleOAuthFlow;

    constructor(config: GoogleDriveConfig) {
        this.config = config;
        this.oauthFlow = new GoogleOAuthFlow({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectPort: this.REDIRECT_PORT
        });
    }

    /**
     * Start OAuth flow to connect Google Drive
     */
    async connectGoogleDrive(): Promise<OAuthTokens> {
        return this.oauthFlow.startOAuthFlow();
    }

    /**
     * Check if connected to Google Drive
     */
    isConnected(): boolean {
        return !!(this.config.accessToken && this.config.refreshToken);
    }

    /**
     * Ensure we have a valid access token, refreshing if necessary
     */
    private async ensureValidToken(): Promise<string> {
        if (this.config.tokenExpiresAt && this.config.refreshToken) {
            if (this.oauthFlow.isTokenExpired(this.config.tokenExpiresAt)) {
                console.log('Access token expired, refreshing...');
                try {
                    const newTokens = await this.oauthFlow.refreshAccessToken(this.config.refreshToken);

                    this.config.accessToken = newTokens.accessToken;
                    this.config.tokenExpiresAt = newTokens.expiresAt;

                    if (this.config.onTokenRefresh) {
                        await this.config.onTokenRefresh(newTokens);
                    }

                    new Notice('Google Drive token automatically refreshed');
                } catch (error: any) {
                    console.error('Token refresh failed:', error);
                    throw new Error('Token refresh failed. Please reconnect Google Drive.');
                }
            }
        }

        if (!this.config.accessToken) {
            throw new Error('Not connected to Google Drive. Please connect first.');
        }

        return this.config.accessToken;
    }

    /**
     * Upload a file to Google Drive with progress callback
     */
    async uploadFile(
        file: File,
        folderPath: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<DriveUploadResult | null> {
        try {
            // Stage 1: Preparing
            onProgress?.({
                stage: 'preparing',
                message: 'Preparing upload...',
                progress: 10
            });

            const accessToken = await this.ensureValidToken();

            // Find or create folder
            const folderId = await this.ensureFolder(folderPath);

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const base64Content = this.arrayBufferToBase64(arrayBuffer);

            // Stage 2: Uploading
            onProgress?.({
                stage: 'uploading',
                message: 'Uploading to Google Drive...',
                progress: 30
            });

            // Create file metadata
            const metadata = {
                name: file.name,
                mimeType: file.type,
                parents: [folderId]
            };

            // Upload using multipart
            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const multipartBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                `Content-Type: ${file.type}\r\n` +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                base64Content +
                closeDelimiter;

            const uploadResponse = await requestUrl({
                url: `${this.UPLOAD_URL}/files?uploadType=multipart&fields=id,webViewLink,webContentLink,name,mimeType`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartBody
            });

            if (uploadResponse.status !== 200) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            const fileData = uploadResponse.json;
            const fileId = fileData.id;

            // Stage 3: Setting permission
            onProgress?.({
                stage: 'setting-permission',
                message: 'Setting public access...',
                progress: 70
            });

            await this.makeFilePublic(fileId);

            // Get updated file info
            const fileInfo = await this.getFileInfo(fileId);

            // Stage 4: Complete
            onProgress?.({
                stage: 'complete',
                message: 'Upload complete!',
                progress: 100
            });

            return {
                fileId: fileId,
                webViewLink: fileInfo.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
                webContentLink: fileInfo.webContentLink || `https://drive.google.com/uc?export=view&id=${fileId}`,
                fileName: file.name,
                mimeType: file.type
            };

        } catch (error: any) {
            console.error('Error uploading to Google Drive:', error);
            onProgress?.({
                stage: 'error',
                message: 'Upload failed',
                progress: 0,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Make a file publicly accessible
     */
    private async makeFilePublic(fileId: string): Promise<void> {
        try {
            const accessToken = await this.ensureValidToken();

            await requestUrl({
                url: `${this.API_URL}/files/${fileId}/permissions`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone'
                })
            });
        } catch (error: any) {
            console.error('Failed to make file public:', error);
            // Don't throw - file is uploaded, just not public
        }
    }

    /**
     * Get file info from Google Drive
     */
    private async getFileInfo(fileId: string): Promise<any> {
        try {
            const accessToken = await this.ensureValidToken();

            const response = await requestUrl({
                url: `${this.API_URL}/files/${fileId}?fields=webViewLink,webContentLink`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.json;
        } catch (error) {
            return {};
        }
    }

    /**
     * Ensure folder exists, creating if necessary
     */
    private async ensureFolder(folderPath: string): Promise<string> {
        const parts = folderPath.split('/').filter(p => p.length > 0);
        let parentId = 'root';

        for (const folderName of parts) {
            const existingId = await this.findFolder(folderName, parentId);

            if (existingId) {
                parentId = existingId;
            } else {
                parentId = await this.createFolder(folderName, parentId);
            }
        }

        return parentId;
    }

    /**
     * Find a folder by name
     */
    private async findFolder(name: string, parentId: string): Promise<string | null> {
        try {
            const accessToken = await this.ensureValidToken();
            const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

            const response = await requestUrl({
                url: `${this.API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id)`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 200) {
                const data = response.json;
                if (data.files && data.files.length > 0) {
                    return data.files[0].id;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Create a new folder
     */
    private async createFolder(name: string, parentId: string): Promise<string> {
        const accessToken = await this.ensureValidToken();

        const metadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };

        const response = await requestUrl({
            url: `${this.API_URL}/files`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        if (response.status !== 200) {
            throw new Error(`Folder creation failed: ${response.status}`);
        }

        return response.json.id;
    }

    /**
     * Test the connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const accessToken = await this.ensureValidToken();

            const response = await requestUrl({
                url: `${this.API_URL}/about?fields=user`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(): Promise<{ email: string; name: string } | null> {
        try {
            const accessToken = await this.ensureValidToken();

            const response = await requestUrl({
                url: `${this.API_URL}/about?fields=user`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 200) {
                const data = response.json;
                return {
                    email: data.user.emailAddress,
                    name: data.user.displayName
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Disconnect from Google Drive
     */
    disconnect(): void {
        this.config.accessToken = '';
        this.config.refreshToken = '';
        this.config.tokenExpiresAt = 0;
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
