import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CheckTokenExpiryGuard } from '../auth/utils/Guard';
import { FolderConfigService } from '../folderConfig/folderConfig.service';
import { GoogleDriveService } from './drive.service';

@Controller('google-drive')
@UseGuards(CheckTokenExpiryGuard) // Handles token validation
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly folderConfigService: FolderConfigService,
  ) {}

  /**
   * List all folders in the user's Google Drive.
   */
  @Get('folders')
  async listFolders(@Request() req: any) {
    const accessToken = req.cookies['access_token']; // Access token is guaranteed by the guard
    try {
      return await this.googleDriveService.listFolders(accessToken);
    } catch (error) {
      console.error('Error listing folders:', error);
      throw new HttpException(
        'Failed to list folders',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List all folder configurations for the authenticated user.
   */
  @Get('configurations')
  async listConfigurations(@Request() req: any) {
    const userId = req.user.id; // Guaranteed by the guard
    try {
      return await this.folderConfigService.listConfigurations(userId);
    } catch (error) {
      console.error('Error listing configurations:', error);
      throw new HttpException(
        'Failed to list folder configurations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Save a folder configuration and set up a push notification.
   */
  @Post('configurations')
  async saveConfiguration(
    @Request() req: any,
    @Body() body: { folderId: string; folderName: string; webhookUrl?: string },
  ) {
    const userId = req.user.id; // Guaranteed by the guard
    const { folderId, folderName, webhookUrl } = body;

    if (!folderId || !folderName) {
      throw new HttpException(
        'Missing required fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.folderConfigService.saveConfiguration(
        userId,
        folderId,
        folderName,
        webhookUrl,
      );
    } catch (error) {
      console.error('Error saving folder configuration:', error);
      if (error.response?.status === HttpStatus.CONFLICT) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Failed to save folder configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a folder configuration and stop its push notification.
   */
  @Delete('configurations')
  async deleteConfiguration(
    @Request() req: any,
    @Body() body: { folderId: string },
  ) {
    const userId = req.user.id; // Guaranteed by the guard
    const { folderId } = body;

    if (!folderId) {
      throw new HttpException('Folder ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.folderConfigService.deleteConfiguration(userId, folderId);
      return { message: 'Folder configuration deleted successfully' };
    } catch (error) {
      console.error('Error deleting folder configuration:', error);
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to delete folder configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
