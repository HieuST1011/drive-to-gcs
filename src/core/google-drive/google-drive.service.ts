import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private readonly drive;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      'YOUR_GOOGLE_CLIENT_ID',
      'YOUR_GOOGLE_CLIENT_SECRET',
      'YOUR_REDIRECT_URL',
    );
    oauth2Client.setCredentials({
      access_token: 'USER_ACCESS_TOKEN',
      refresh_token: 'USER_REFRESH_TOKEN',
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Đăng ký kênh Push Notification
  async watchDriveChanges() {
    const res = await this.drive.files.watch({
      fileId: 'YOUR_FILE_ID',
      requestBody: {
        id: 'UNIQUE_CHANNEL_ID',
        type: 'web_hook',
        address: 'YOUR_WEBHOOK_URL',
      },
    });
    return res.data;
  }
}
