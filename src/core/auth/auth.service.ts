import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class AuthService {
  private readonly oauth2Client;

  constructor() {
    // Cấu hình OAuth2 Client với client ID và client secret của bạn
    this.oauth2Client = new google.auth.OAuth2(
      'YOUR_GOOGLE_CLIENT_ID',
      'YOUR_GOOGLE_CLIENT_SECRET',
      'YOUR_REDIRECT_URL',
    );
  }

  // Lấy URL login OAuth
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  // Lấy access token sau khi người dùng login thành công
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }
}
