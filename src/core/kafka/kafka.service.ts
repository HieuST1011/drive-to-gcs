import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(
    @Inject('GOOGLE_DRIVE_KAFKA_CLIENT') // Injecting Kafka client
    private readonly kafkaClient: ClientKafka,
  ) {}

  async sendMessage(message: any): Promise<void> {
    try {
      // Send the message to the Kafka topic
      this.kafkaClient.send('google-drive-topic', message);
      console.log('Message sent to Kafka');
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
    }
  }
}
