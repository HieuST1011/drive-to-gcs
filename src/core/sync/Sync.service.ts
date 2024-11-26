import { Injectable } from '@nestjs/common';
import { GoogleDriveService } from '../drive/drive.service';
import { FolderConfigService } from '../folderConfig/folderConfig.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly folderConfigService: FolderConfigService,
  ) {}

  async syncFolders(userId: string, accessToken: string): Promise<void> {
    const folderConfigs =
      await this.folderConfigService.listConfigurations(userId);

    for (const config of folderConfigs) {
      console.log(`Syncing folder: ${config.folderName} (${config.folderId})`);
      // Perform file sync logic here using Google Drive API
    }
  }
}
