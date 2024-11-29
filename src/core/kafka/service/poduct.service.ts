import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka = new Kafka({
    clientId: 'google-drive',
    brokers: ['localhost:9092'], // Update with your Kafka broker addresses
  });
  private readonly producer: Producer = this.kafka.producer();

  // Initialize the producer when the module starts
  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    console.log('Kafka producer connected.');
  }

  // Gracefully close the producer when the module is destroyed
  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    console.log('Kafka producer disconnected.');
  }

  // Send a message to a Kafka topic
  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`Message sent to topic ${topic}:`, message);
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
    }
  }
}
