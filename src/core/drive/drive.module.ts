import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderConfiguration } from 'src/typeorm/entities/FolderConfiguration';
import { GoogleDriveController } from './drive.controller';
import { GoogleDriveService } from './drive.service';
import { FolderConfigService } from '../folderConfig/folderConfig.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FolderConfiguration]), AuthModule],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService, FolderConfigService],
  exports: [GoogleDriveService],
})
export class DriveModule {}
