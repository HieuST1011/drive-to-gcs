import {
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { GoogleDriveService } from '../drive/drive.service';
import { FolderConfigService } from './folderConfig.service';
import { AuthService } from '../auth/auth.service';

@Controller('webhook')
export class FolderConfigController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly folderConfigService: FolderConfigService,
    private readonly authService: AuthService,
  ) {}

  // Webhook endpoint to handle notifications
  @Post('url')
  async handleDriveNotification(@Headers() headers: any) {
    const resourceId = headers['x-goog-resource-id'];
    const changedFields = headers['x-goog-changed'] || '';
    const resourceUri = headers['x-goog-resource-uri'];
    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state'];
    console.log(resourceState);

    if (!resourceId) {
      throw new HttpException('Resource ID is missing', HttpStatus.BAD_REQUEST);
    }

    // Find the corresponding folder configuration from the database
    const folderConfig =
      await this.folderConfigService.findFolderById(channelId);

    if (!folderConfig) {
      throw new HttpException(
        'Folder configuration not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const user = await this.authService.findUser(Number(folderConfig.userId));

    // Check if the resource is deleted (moved to trash)
    if (resourceState === 'trash') {
      try {
        // Mark the folder as deleted in the database (or remove it entirely)
        await this.folderConfigService.deleteConfiguration(
          String(user.id),
          folderConfig.folderId,
          user.accessToken,
          resourceId,
        );

        return {
          status: 'Success',
          message: 'Folder deleted in Google Drive and database updated',
        };
      } catch (error) {
        console.error('Error processing trash notification:', error);
        throw new HttpException(
          'Failed to process folder deletion',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Handle updates to folder properties (like name)
    if (changedFields.includes('properties')) {
      try {
        // Extract the file/folder ID from the resource URI
        const fileId = resourceUri.split('/').pop()?.split('?')[0];

        // Get the updated folder details from Google Drive
        const updatedFolder = await this.googleDriveService.getFileDetails(
          user.accessToken,
          fileId,
        );

        // If the folder name has changed, update the database
        if (
          updatedFolder?.name &&
          updatedFolder.name !== folderConfig.folderName
        ) {
          folderConfig.folderName = updatedFolder.name;
          await this.folderConfigService.saveFolderConfig(folderConfig);
        }

        return { status: 'Success', message: 'Folder configuration updated' };
      } catch (error) {
        console.error('Error processing Google Drive notification:', error);
        throw new HttpException(
          'Failed to process notification',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      return { status: 'Ignored', message: 'No relevant changes detected' };
    }
  }
}
