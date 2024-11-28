import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderConfiguration } from 'src/typeorm/entities/FolderConfiguration';
import { FolderConfigService } from '../folderConfig/folderConfig.service';
import { FolderConfigController } from './folderConfig.controller';
import { GoogleDriveService } from '../drive/drive.service';
import { AuthService } from '../auth/auth.service';
import { User } from 'src/typeorm/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([FolderConfiguration, User])],
  controllers: [FolderConfigController],
  providers: [FolderConfigService, GoogleDriveService, AuthService],
})
export class FolderConfigModule {}