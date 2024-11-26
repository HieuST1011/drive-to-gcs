import { IsString } from 'class-validator';

export class SyncDto {
  @IsString()
  localFolderPath: string;

  @IsString()
  driveFolderId: string;
}
