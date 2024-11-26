import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderConfiguration } from 'src/typeorm/entities/FolderConfiguration';
import { AuthModule } from '../auth/auth.module';
import { GoogleDriveController } from './drive.controller';
import { GoogleDriveService } from './drive.service';
import { FolderConfigService } from '../folderConfig/folderConfig.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([FolderConfiguration])],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService, FolderConfigService],
})
export class DriveModule {}
