import { Module } from '@nestjs/common';
import { GoogleDriveController } from './drive.controller';
import { GoogleDriveService } from './drive.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncConfig } from 'src/typeorm/entities/FolderConfiguration';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([SyncConfig])],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService],
})
export class DriveModule {}
