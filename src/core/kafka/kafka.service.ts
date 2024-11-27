import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AuthService } from '../auth/auth.service'; // Inject AuthService
import { GoogleDriveService } from '../drive/drive.service';

@Injectable()
export class KafkaService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: ClientKafka,
    private readonly authService: AuthService, // Injecting AuthService
    private readonly googleDriveService: GoogleDriveService, // Inject GoogleDriveService
  ) {}

  // Handle incoming Kafka messages (Push Notifications)
  async handleDriveNotification(message: any, req: any) {
    const { fileId, changeType, userId } = message;

    // Get the access token from cookies via AuthService
    const accessToken = await this.authService.getAccessTokenFromCookies(req);
    const refreshToken = await this.authService.getRefreshTokenFromCookies(req);

    if (!accessToken || !refreshToken) {
      console.error('No tokens found for user:', userId);
      return; // Exit if tokens are missing
    }

    console.log('Received Google Drive push notification:', message);

    // Access the file and check for changes
    const file = await this.googleDriveService.getFileDetails(
      accessToken,
      fileId,
    );

    if (file) {
      // Handle file changes (e.g., upload to GCS)
      await this.uploadFileToGCS(file);
    }
  }

  // Upload file to GCS
  private async uploadFileToGCS(file: any): Promise<void> {
    // Implement your logic to upload the file to GCS
    console.log(`Uploading file ${file.name} to GCS...`);
  }

  // Subscribe to Kafka messages
  onModuleInit() {
    this.kafkaService.subscribeToResponseOf('google-drive-push-notification');
    this.kafkaService.onMessage(
      'google-drive-push-notification',
      (message, req) => {
        this.handleDriveNotification(message, req);
      },
    );
  }
}
