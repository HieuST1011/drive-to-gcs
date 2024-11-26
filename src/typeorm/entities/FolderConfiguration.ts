import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class FolderConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  folderId: string;

  @Column()
  folderName: string;

  @Column()
  userId: string; // Link to your user system, e.g., the Google account ID

  @Column({ nullable: true })
  channelId: string; // The channel ID for the push notification

  @Column({ nullable: true })
  webhookUrl: string; // URL for the webhook to send notifications to

  @Column({ nullable: true })
  expiration: string; // The expiration time of the notification channel
}
