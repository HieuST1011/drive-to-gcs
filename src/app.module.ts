import { Module } from '@nestjs/common';
import { AuthModule } from './core/auth/auth.module';
import { KafkaModule } from './kafka/kafka.module';
import { GcsService } from './gcs/gcs.service';
import { GcsModule } from './gcs/gcs.module';

@Module({
  imports: [AuthModule, KafkaModule, GcsModule],
  controllers: [],
  providers: [GcsService],
})
export class AppModule {}
