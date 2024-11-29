import { Injectable } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common/interfaces';
import { Kafka, EachMessagePayload } from 'kafkajs';
import { AuthService } from '../../auth/auth.service';
import { FolderConfigService } from 'src/core/folderConfig/folderConfig.service';
import { GoogleDriveService } from 'src/core/drive/drive.service';

@Injectable()
export class DriveNotificationsConsumer implements OnModuleInit {
  private readonly kafka = new Kafka({
    clientId: 'google-drive',
    brokers: ['localhost:9092'], // Update with your broker addresses
  });
  private readonly consumer = this.kafka.consumer({ groupId: 'drive-group' });

  constructor(
    private readonly folderConfigService: FolderConfigService,
    private readonly authService: AuthService,
    private readonly googleDriveService: GoogleDriveService, // Injecting GoogleDriveService
  ) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'google.drive.notifications',
      fromBeginning: false,
    });

    this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        const payload = JSON.parse(message.value.toString());
        await this.handleMessage(payload);
      },
    });
  }

  private async handleMessage(payload: {
    channelId: string;
    resourceId: string;
    resourceState: string;
    resourceUri: string;
  }) {
    const { channelId, resourceId, resourceState, resourceUri } = payload;

    const folderConfig =
      await this.folderConfigService.findFolderById(channelId);
    if (!folderConfig) {
      console.error(`Folder configuration for channel ${channelId} not found`);
      return;
    }

    const user = await this.authService.findUser(Number(folderConfig.userId));
    let { accessToken, refreshToken } = user;

    // Refresh the access token if expired
    if (await this.authService.isTokenExpired(accessToken)) {
      if (!refreshToken) {
        console.error('No refresh token available');
        return;
      }

      accessToken = await this.authService.getNewAccessToken(refreshToken);
      user.accessToken = accessToken;
      await this.authService.updateUser(user);
      console.log('Refresh OAuth Token notification received.');
    }

    switch (resourceState) {
      case 'sync':
        console.log('Sync notification received.');
        // No further processing needed for sync, just acknowledge
        return { status: 'Success', message: 'Sync acknowledged' };

      case 'update': {
        const fileId = resourceUri.split('/').pop()?.split('?')[0];
        const updatedFolder = await this.googleDriveService.getFileDetails(
          user.accessToken,
          fileId,
        );

        if (
          updatedFolder?.name &&
          updatedFolder.name !== folderConfig.folderName
        ) {
          folderConfig.folderName = updatedFolder.name;
          await this.folderConfigService.saveFolderConfig(folderConfig);
        }
        console.log('Update notification received.');
        return { status: 'Success', message: 'Folder updated' };
      }

      case 'trash':
        await this.folderConfigService.deleteConfiguration(
          String(user.id),
          folderConfig.folderId,
          user.accessToken,
          resourceId,
        );
        console.log('Delete notification received.');
        return { status: 'Success', message: 'Folder deleted' };

      default:
        return { status: 'Ignored', message: 'No relevant changes' };
    }
  }
}
