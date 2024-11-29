import { forwardRef, Module } from '@nestjs/common';
import { DriveNotificationsConsumer } from './service/consumer.service';
import { KafkaProducerService } from './service/poduct.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { FolderConfigModule } from '../folderConfig/folderConfig.module';
import { DriveModule } from '../drive/drive.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => FolderConfigModule),
    DriveModule,
    TypeOrmModule.forFeature([User]),
  ], // Ensure FolderConfigModule is imported
  providers: [KafkaProducerService, DriveNotificationsConsumer, AuthService],
  exports: [KafkaProducerService], // Optionally export services if needed elsewhere
})
export class KafkaModule {}
