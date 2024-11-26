import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { google } from 'googleapis';
import { SyncConfig } from 'src/typeorm/entities/FolderConfiguration';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleDriveService {
  private drive: any;

  constructor(
    @InjectRepository(SyncConfig)
    private readonly syncConfigRepository: Repository<SyncConfig>,
  ) {
    this.drive = google.drive({ version: 'v3' });
  }

  // Authenticate using the provided access token
  authenticate(accessToken: string) {
    console.log('Access Token:', accessToken); // Debugging the access token value
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    this.drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    });

    console.log('Google Drive Client Authenticated');
  }

  // List Google Drive folders
  async listDriveFolders() {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'", // Filter for folders
        fields: 'files(id, name)', // Fields to return: folder id and name
      });

      return response.data.files; // Return the list of folders
    } catch (error) {
      throw new Error('Error listing Google Drive folders: ' + error.message);
    }
  }

  // Create a new folder on Google Drive
  async createFolder(folderName: string) {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name',
      });

      return folder.data;
    } catch (error) {
      throw new Error('Error creating folder: ' + error.message);
    }
  }

  // Save selected folders to the database with userId
  async saveSyncConfig(userId: number, folderIds: string[]) {
    // Delete existing configurations for this user (if needed)
    await this.syncConfigRepository.delete({ userId });

    // Insert new configurations
    const syncConfigs = folderIds.map((folderId) => {
      const config = new SyncConfig();
      config.userId = userId; // Assign the userId directly
      config.folderId = folderId;
      config.syncStatus = 'pending'; // Initially set to 'pending'
      return config;
    });

    await this.syncConfigRepository.save(syncConfigs);
  }

  // Fetch synced folders for the user
  async getSyncConfig(userId: number) {
    return await this.syncConfigRepository.find({ where: { userId } });
  }

  // Sync the folder (you would write the sync logic here)
  async syncFolder(folderId: string) {
    // Your logic for syncing the folder
  }
}
