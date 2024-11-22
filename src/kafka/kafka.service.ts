import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
  private readonly kafka;
  private readonly producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'drive-sync',
      brokers: ['localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async sendDriveChangeMessage(message: any) {
    await this.producer.send({
      topic: 'drive-changes',
      messages: [{ value: JSON.stringify(message) }],
    });
  }
}
