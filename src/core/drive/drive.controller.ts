import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CheckTokenExpiryGuard } from '../auth/utils/Guard';
import { FolderConfigService } from '../folderConfig/folderConfig.service';
import { GoogleDriveService } from './drive.service';

@Controller('google-drive')
@UseGuards(CheckTokenExpiryGuard)
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly folderConfigService: FolderConfigService,
  ) {}

  @Get('folders')
  async listFolders(@Request() req: any) {
    const accessToken = req.cookies['access_token'];
    return this.googleDriveService.listFolders(accessToken);
  }

  // List all folder configurations (including push notification setup) for the user
  @Get('configurations')
  async listConfigurations(@Request() req: any) {
    const userId = req.user.id; // Assuming you store user info in `req.user`
    return this.folderConfigService.listConfigurations(userId); // Get the folder configurations from the database
  }

  // Save a folder configuration (and set up a push notification)
  @Post('configurations')
  async saveConfiguration(
    @Request() req: any,
    @Body() body: { folderId: string; folderName: string; webhookUrl: string },
  ) {
    const userId = req.user.id;
    const { folderId, folderName, webhookUrl } = body;

    // Save the folder configuration and set up push notification
    return this.folderConfigService.saveConfiguration(
      userId,
      folderId,
      folderName,
      webhookUrl, // Providing webhook URL to receive notifications
    );
  }

  // Delete a folder configuration and stop the associated push notification
  @Delete('configurations')
  async deleteConfiguration(
    @Request() req: any,
    @Body() body: { folderId: string },
  ) {
    const userId = req.user.id;
    const { folderId } = body;

    // Delete the folder configuration and stop the push notification
    return this.folderConfigService.deleteConfiguration(userId, folderId);
  }
}
