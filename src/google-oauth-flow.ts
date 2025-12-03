/**
 * Google OAuth Flow - Browser-based authentication
 * Handles token acquisition and refresh for Google Drive API
 */
import { Notice, requestUrl } from 'obsidian';
import * as http from 'http';
import * as url from 'url';
import { OAuthTokens } from './types';

export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectPort: number;
}

export class GoogleOAuthFlow {
    private readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private readonly SCOPES = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    private config: OAuthConfig;
    private server: http.Server | null = null;

    constructor(config: OAuthConfig) {
        this.config = config;
    }

    /**
     * Start the OAuth flow - opens browser and waits for callback
     */
    async startOAuthFlow(): Promise<OAuthTokens> {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate PKCE code verifier and challenge for security
                const codeVerifier = this.generateCodeVerifier();
                const codeChallenge = await this.generateCodeChallenge(codeVerifier);

                // Start local server to receive callback
                const redirectUri = `http://localhost:${this.config.redirectPort}/callback`;

                this.server = http.createServer(async (req, res) => {
                    try {
                        const parsedUrl = url.parse(req.url || '', true);

                        if (parsedUrl.pathname === '/callback') {
                            const code = parsedUrl.query.code as string;
                            const error = parsedUrl.query.error as string;

                            if (error) {
                                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                                res.end(this.getErrorHtml(error));
                                this.cleanup();
                                reject(new Error(`OAuth error: ${error}`));
                                return;
                            }

                            if (code) {
                                try {
                                    // Exchange code for tokens
                                    const tokens = await this.exchangeCodeForTokens(code, codeVerifier, redirectUri);

                                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                                    res.end(this.getSuccessHtml());
                                    this.cleanup();
                                    resolve(tokens);
                                } catch (tokenError: any) {
                                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                                    res.end(this.getErrorHtml(tokenError.message));
                                    this.cleanup();
                                    reject(tokenError);
                                }
                            }
                        }
                    } catch (err) {
                        reject(err);
                    }
                });

                this.server.listen(this.config.redirectPort, () => {
                    console.log(`OAuth callback server listening on port ${this.config.redirectPort}`);
                });

                // Handle server errors
                this.server.on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        reject(new Error(`Port ${this.config.redirectPort} is already in use. Please close other applications using this port.`));
                    } else {
                        reject(err);
                    }
                });

                // Build authorization URL
                const authUrl = this.buildAuthUrl(redirectUri, codeChallenge);

                // Open browser
                new Notice('Please log in with Google in your browser...', 3000);
                const { shell } = require('electron');
                shell.openExternal(authUrl);

                // Set timeout (2 minutes)
                setTimeout(() => {
                    if (this.server) {
                        this.cleanup();
                        reject(new Error('OAuth flow timed out. Please try again.'));
                    }
                }, 120000);

            } catch (error) {
                this.cleanup();
                reject(error);
            }
        });
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
        try {
            const response = await requestUrl({
                url: this.TOKEN_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }).toString()
            });

            if (response.status !== 200) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }

            const data = response.json;
            const expiresAt = Date.now() + (data.expires_in * 1000);

            return {
                accessToken: data.access_token,
                refreshToken: refreshToken, // Refresh token doesn't change
                expiresIn: data.expires_in,
                expiresAt: expiresAt
            };
        } catch (error: any) {
            console.error('Token refresh error:', error);
            throw new Error(`Failed to refresh token: ${error.message}`);
        }
    }

    /**
     * Check if token is expired or about to expire (within 5 minutes)
     */
    isTokenExpired(expiresAt: number): boolean {
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        return Date.now() >= (expiresAt - bufferTime);
    }

    /**
     * Exchange authorization code for tokens
     */
    private async exchangeCodeForTokens(
        code: string,
        codeVerifier: string,
        redirectUri: string
    ): Promise<OAuthTokens> {
        const response = await requestUrl({
            url: this.TOKEN_URL,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                code_verifier: codeVerifier
            }).toString()
        });

        if (response.status !== 200) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const data = response.json;
        const expiresAt = Date.now() + (data.expires_in * 1000);

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            expiresAt: expiresAt
        };
    }

    /**
     * Build OAuth authorization URL
     */
    private buildAuthUrl(redirectUri: string, codeChallenge: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: this.SCOPES.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        return `${this.AUTH_URL}?${params.toString()}`;
    }

    /**
     * Generate random code verifier for PKCE
     */
    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64UrlEncode(array);
    }

    /**
     * Generate code challenge from verifier
     */
    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(hash));
    }

    /**
     * Base64 URL encode
     */
    private base64UrlEncode(buffer: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < buffer.length; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * Cleanup server
     */
    private cleanup(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }

    /**
     * Success HTML page
     */
    private getSuccessHtml(): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Google Drive Connection Complete</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
        }
        .container {
            background: white;
            padding: 40px 60px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
        }
        .close-hint {
            font-size: 14px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Connection Complete!</h1>
        <p>Google Drive has been connected to Drive Embedder.</p>
        <p class="close-hint">You can close this window and return to Obsidian.</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Error HTML page
     */
    private getErrorHtml(error: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Connection Failed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #ea4335 0%, #fbbc05 100%);
        }
        .container {
            background: white;
            padding: 40px 60px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
        }
        .error-detail {
            background: #fff3f3;
            border: 1px solid #ffcccc;
            padding: 10px 20px;
            border-radius: 8px;
            color: #cc0000;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Connection Failed</h1>
        <p>Failed to connect to Google Drive.</p>
        <div class="error-detail">${error}</div>
        <p>Please try again in Obsidian.</p>
    </div>
</body>
</html>
        `;
    }
}
