import { Injectable } from '@nestjs/common';
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

  // List folder configurations for a specific user
  async listConfigurations(userId: string): Promise<FolderConfiguration[]> {
    return this.folderConfigRepository.find({ where: { userId } });
  }

  // Save a new folder configuration and start watching for changes on Google Drive
  async saveConfiguration(
    userId: string,
    folderId: string,
    folderName: string,
    webhookUrl: string,
  ): Promise<FolderConfiguration> {
    const folderConfig = this.folderConfigRepository.create({
      userId,
      folderId,
      folderName,
      webhookUrl,
    });

    // Initialize push notification for the folder
    const channel = await this.googleDriveService.watchFileForChanges(
      userId,
      folderId,
      webhookUrl,
    );

    // Save the channel ID and other necessary details to the database
    folderConfig.channelId = channel.id;
    folderConfig.expiration = channel.expiration;

    return this.folderConfigRepository.save(folderConfig);
  }

  // Delete folder configuration and stop push notifications for the folder
  async deleteConfiguration(userId: string, folderId: string): Promise<void> {
    const folderConfig = await this.folderConfigRepository.findOne({
      where: { userId, folderId },
    });

    if (folderConfig?.channelId) {
      // Stop the push notification channel
      await this.googleDriveService.stopChannelWatch(folderConfig.channelId);
    }

    // Delete the folder configuration from the database
    await this.folderConfigRepository.delete({ userId, folderId });
  }
}
