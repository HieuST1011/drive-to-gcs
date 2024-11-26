import {
  Controller,
  Get,
  UnauthorizedException,
  Request,
  UseGuards,
  Post,
} from '@nestjs/common';
import { GoogleDriveService } from './drive.service';
import { AuthService } from '../auth/auth.service';
import { CheckTokenExpiryGuard } from '../auth/utils/Guard';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly authService: AuthService,
  ) {}

  // Endpoint to list folders in Google Drive
  @Get('folders')
  @UseGuards(CheckTokenExpiryGuard)
  async getFolders(@Request() req: any) {
    const accessToken = req.cookies['access_token'];

    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }

    // Authenticate with Google API using the access token
    this.googleDriveService.authenticate(accessToken);

    // Fetch folders from Google Drive
    const folders = await this.googleDriveService.listDriveFolders();
    return folders;
  }

  @Get('create-folder')
  @UseGuards(CheckTokenExpiryGuard)
  async createFolder(@Request() req: any) {
    const accessToken = req.cookies['access_token'];

    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }

    const folderName = 'New Folder'; // Example folder name

    // Authenticate with Google API using the access token
    this.googleDriveService.authenticate(accessToken);

    // Create a new folder in Google Drive
    const newFolder = await this.googleDriveService.createFolder(folderName);
    return newFolder;
  }

  @Post('sync/configure')
  @UseGuards(CheckTokenExpiryGuard)
  async configureSyncFolders(@Request() req: any) {
    const accessToken = req.cookies['access_token'];

    if (!accessToken) {
      throw new UnauthorizedException('No access token');
    }

    const user = await this.authService.findUserByAccessToken(accessToken);
    const userId = user.id;
    const { selectedFolderIds } = req.body; // Get selected folder IDs from the request body

    // Save selected folders to the database with the user's ID
    await this.googleDriveService.saveSyncConfig(userId, selectedFolderIds);

    return { message: 'Folders successfully configured for sync.' };
  }

  @Get('sync/configure')
  async getSyncFolders(@Request() req: any) {
    const userId = req.user.id; // Assuming the user information is available in req.user

    // Fetch all the configured folders for the user
    const folders = await this.googleDriveService.getSyncConfig(userId);
    return folders;
  }
}
