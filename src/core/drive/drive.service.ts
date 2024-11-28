import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { drive_v3, google } from 'googleapis';
import { FolderConfiguration } from 'src/typeorm/entities/FolderConfiguration';
import { Repository } from 'typeorm';
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
  private readonly authClient: OAuth2Client;

  constructor(
    @InjectRepository(FolderConfiguration)
    private readonly folderConfigRepository: Repository<FolderConfiguration>,
  ) {
    this.authClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  private async initializeClient(accessToken: string): Promise<void> {
    this.authClient.setCredentials({ access_token: accessToken });
    this.driveClient = google.drive({ version: 'v3', auth: this.authClient });
  }

  /**
   * List all folders in the user's Google Drive
   */
  async listFolders(accessToken: string): Promise<drive_v3.Schema$File[]> {
    await this.initializeClient(accessToken);

    const response = await this.driveClient.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
    });
    return response.data.files || [];
  }

  /**
   * Watch a specific file or folder for changes
   */
  async watchFileForChanges(
    accessToken: string,
    fileId: string,
    webhookUrl: string | null,
  ): Promise<drive_v3.Schema$Channel> {
    await this.initializeClient(accessToken);

    const channelId = uuidv4();
    const channel: Channel = {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl || '',
      resourceId: fileId,
      resourceUri: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      kind: 'api#channel',
      payload: true,
    };

    if (webhookUrl) {
      try {
        const response = await this.driveClient.files.watch({
          fileId,
          requestBody: channel,
        });
        return response.data; // Return the channel data
      } catch (error) {
        console.error('Error starting watch:', error);
        throw new Error('Failed to set up file watch');
      }
    } else {
      // If no webhookUrl is provided, return a placeholder response indicating no watch was set
      console.warn('No webhook URL provided, skipping watch setup.');
      return { id: channelId, kind: 'api#channel', resourceId: fileId };
    }
  }

  /**
   * Stop the push notification for a specific channel
   */
  async stopChannelWatch(
    accessToken: string,
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    await this.initializeClient(accessToken);

    const channel: drive_v3.Schema$Channel = {
      id: channelId,
      kind: 'api#channel',
      resourceId: resourceId,
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

  /**
   * List files in a specific folder
   */
  async listFilesInFolder(
    accessToken: string,
    folderId: string,
  ): Promise<drive_v3.Schema$File[]> {
    await this.initializeClient(accessToken);

    const response = await this.driveClient.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });
    return response.data.files || [];
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(
    accessToken: string,
    fileId: string,
  ): Promise<NodeJS.ReadableStream> {
    await this.initializeClient(accessToken);

    try {
      const response = await this.driveClient.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' },
      );
      return response.data as NodeJS.ReadableStream;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Get file details by file ID from Google Drive.
   * @param accessToken The access token for the user.
   * @param fileId The file ID of the file to fetch.
   * @returns The file details from Google Drive.
   */
  async getFileDetails(
    accessToken: string,
    fileId: string,
  ): Promise<drive_v3.Schema$File> {
    await this.initializeClient(accessToken);

    try {
      // Make a request to get file details
      const response = await this.driveClient.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size',
      });

      return response.data; // Return the file details
    } catch (error) {
      console.error('Error fetching file details:', error);
      throw new Error('Failed to fetch file details.');
    }
  }

  async processWebhookNotification(
    channelId: string,
    resourceId: string,
    eventType: string,
  ): Promise<void> {
    console.log('Processing notification:', {
      channelId,
      resourceId,
      eventType,
    });

    // Find the folder configuration by channel ID
    const folderConfig = await this.folderConfigRepository.findOne({
      where: { channelId },
    });

    if (!folderConfig) {
      console.warn('No folder configuration found for channel:', channelId);
      return;
    }

    // Fetch the updated folder details from Google Drive
    const accessToken = '<ACCESS_TOKEN>'; // Retrieve the user's access token
    const folderDetails = await this.getFileDetails(
      accessToken,
      folderConfig.folderId,
    );

    // Update the folder name or other details in your database
    if (folderDetails.name !== folderConfig.folderName) {
      folderConfig.folderName = folderDetails.name;
      await this.folderConfigRepository.save(folderConfig);

      console.log('Folder name updated in database:', folderDetails.name);
    }

    // Notify the rest of your application (e.g., via events, WebSocket, etc.)
  }
}
