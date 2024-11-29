import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FolderConfiguration } from 'src/typeorm/entities/FolderConfiguration';
import { Repository } from 'typeorm';
import { GoogleDriveService } from '../drive/drive.service';

@Injectable()
export class FolderConfigService {
  constructor(
    @InjectRepository(FolderConfiguration)
    private readonly folderConfigRepository: Repository<FolderConfiguration>,
    private readonly googleDriveService: GoogleDriveService, // Injecting GoogleDriveService
  ) {}

  async saveFolderConfig(folder: FolderConfiguration) {
    await this.folderConfigRepository.save(folder);
  }

  async findFolderById(id: string) {
    return await this.folderConfigRepository.findOne({
      where: { channelId: id },
    });
  }

  async findByFolderId(folderId: string) {
    return await this.folderConfigRepository.findOne({
      where: { folderId: folderId },
    });
  }

  /**
   * List all folder configurations for a specific user.
   */
  async listConfigurations(userId: string): Promise<FolderConfiguration[]> {
    return this.folderConfigRepository.find({ where: { userId } });
  }

  /**
   * Save a new folder configuration and start watching for changes on Google Drive.
   */
  async saveConfiguration(
    userId: string,
    folderId: string,
    folderName: string,
    webhookUrl: string | null,
    accessToken: string,
  ): Promise<FolderConfiguration> {
    // Check if the folder is already configured
    const existingConfig = await this.folderConfigRepository.findOne({
      where: { userId, folderId },
    });
    if (existingConfig) {
      throw new ConflictException(
        'This folder is already configured for sync.',
      );
    }

    // Create a new folder configuration
    const folderConfig = this.folderConfigRepository.create({
      userId,
      folderId,
      folderName,
      webhookUrl,
    });

    try {
      // Initialize push notification for the folder
      const channel = await this.googleDriveService.watchFileForChanges(
        accessToken,
        folderId,
        webhookUrl,
      );

      // Save the channel ID and expiration details
      folderConfig.channelId = channel.id;
      folderConfig.resourceId = channel.resourceId;
      // If expiration is provided and is a valid date string, set it
      if (
        channel.expiration &&
        !isNaN(new Date(channel.expiration).getTime())
      ) {
        folderConfig.expiration = new Date(channel.expiration); // Properly handle ISO date format
      } else {
        folderConfig.expiration = null; // If no expiration, set as null
      }

      // Save the configuration to the database
      return await this.folderConfigRepository.save(folderConfig);
    } catch (error) {
      console.error('Error while setting up Google Drive channel:', error);
      throw new Error('Failed to save folder configuration. Please try again.');
    }
  }

  /**
   * Delete a folder configuration and stop push notifications for the folder.
   */
  async deleteConfiguration(
    userId: string,
    folderId: string,
    accessToken: string,
    resourceId: string,
  ): Promise<void> {
    // Find the folder configuration
    const folderConfig = await this.folderConfigRepository.findOne({
      where: { userId, folderId },
    });

    if (!folderConfig) {
      throw new NotFoundException('Folder configuration not found.');
    }

    // Stop the push notification channel if it exists
    if (folderConfig.channelId) {
      try {
        await this.googleDriveService.stopChannelWatch(
          accessToken,
          folderConfig.channelId,
          resourceId,
        );
      } catch (error) {
        console.warn('Error while stopping Google Drive channel:', error);
        // Don't block the deletion process if stopping the channel fails
      }
    }

    // Delete the configuration from the database
    await this.folderConfigRepository.delete({ userId, folderId });
  }

  /**
   * Update a folder configuration's sync status.
   */
  async updateSyncStatus(
    userId: string,
    folderId: string,
    syncStatus: string,
  ): Promise<FolderConfiguration> {
    const folderConfig = await this.folderConfigRepository.findOne({
      where: { userId, folderId },
    });

    if (!folderConfig) {
      throw new NotFoundException('Folder configuration not found.');
    }

    folderConfig.syncStatus = syncStatus;
    return this.folderConfigRepository.save(folderConfig);
  }
}
