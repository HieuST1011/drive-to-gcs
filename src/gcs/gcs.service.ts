import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private readonly storage;

  constructor() {
    this.storage = new Storage({
      projectId: 'YOUR_PROJECT_ID',
      keyFilename: 'YOUR_GCS_KEY_FILE.json',
    });
  }

  async uploadFile(fileName: string, filePath: string) {
    await this.storage.bucket('YOUR_BUCKET_NAME').upload(filePath, {
      destination: fileName,
    });
    console.log('File uploaded to GCS');
  }
}
