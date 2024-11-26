import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

interface Channel {
  payload?: boolean;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
  type: string;
  address: string;
  params?: Record<string, string>;
  kind: string;
}

@Injectable()
export class GoogleDriveService {
  private driveClient: drive_v3.Drive;

  constructor() {}

  async initializeClient(accessToken: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.driveClient = google.drive({ version: 'v3', auth });
  }

  async listFolders(accessToken: string): Promise<drive_v3.Schema$File[]> {
    await this.initializeClient(accessToken);

    const response = await this.driveClient.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
    });
    return response.data.files || [];
  }

  // Set up a push notification for a specific file or folder
  // Watch a specific file or folder for changes
  async watchFileForChanges(
    accessToken: string,
    fileId: string,
    webhookUrl: string,
  ): Promise<any> {
    await this.initializeClient(accessToken);

    const channelId = uuidv4(); // Generate a unique channel ID

    const channel: Channel = {
      id: channelId, // Unique channel ID
      type: 'web_hook', // Use web_hook as the delivery type
      address: webhookUrl, // Your server endpoint for receiving notifications
      resourceId: fileId, // The file or folder ID you want to watch
      resourceUri: `https://www.googleapis.com/drive/v3/files/${fileId}`, // Full resource URI for the file
      kind: 'api#channel', // Identifies this as a channel object
      payload: true, // Include payload data with the notification
      // Optional parameters
      params: {
        customKey: 'customValue',
      },
    };

    try {
      // Start watching the file using Google Drive API
      const response = await this.driveClient.files.watch({
        fileId,
        requestBody: channel,
      });

      // Optionally, you can save the channel configuration to your database
      // await this.saveChannelConfiguration(response.data);

      return response.data;
    } catch (error) {
      console.error('Error starting watch:', error);
      throw new Error('Failed to set up file watch');
    }
  }

  // Stop the push notification for a channel
  async stopChannelWatch(channelId: string): Promise<void> {
    const channel: drive_v3.Schema$Channel = {
      id: channelId, // The ID of the channel to stop
      kind: 'api#channel',
    };

    try {
      await this.driveClient.channels.stop({
        requestBody: channel,
      });
      console.log('Stopped watching the channel');
    } catch (error) {
      console.error('Error stopping channel watch:', error);
      throw new Error('Failed to stop watching the channel');
    }
  }
}
