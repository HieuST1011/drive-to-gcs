import {
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { KafkaProducerService } from '../kafka/service/poduct.service';

@Controller('webhook')
export class FolderConfigController {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  @Post('url')
  async handleDriveNotification(@Headers() headers: any) {
    const resourceId = headers['x-goog-resource-id'];
    const resourceUri = headers['x-goog-resource-uri'];
    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state'];

    if (!resourceId) {
      throw new HttpException('Resource ID is missing', HttpStatus.BAD_REQUEST);
    }

    // Push to Kafka for further processing
    await this.kafkaProducer.sendMessage('google.drive.notifications', {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
    });

    return { status: 'Success', message: 'Notification received' };
  }
}
