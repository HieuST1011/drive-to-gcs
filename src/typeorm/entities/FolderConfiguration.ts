import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  resourceId: string; // The Google Drive resource ID (file/folder ID)

  @Column({ nullable: true })
  webhookUrl: string; // URL for the webhook to send notifications to

  @Column({ type: 'timestamp', nullable: true })
  expiration: Date; // The expiration time of the notification channel

  @Column({ default: 'active' })
  syncStatus: string; // Possible values: 'active', 'paused', 'completed'

  @Column({ default: false })
  deleted: boolean; // Add a 'deleted' field to mark folders as deleted

  @CreateDateColumn()
  createdAt: Date; // Automatically managed by TypeORM

  @UpdateDateColumn()
  updatedAt: Date; // Automatically managed by TypeORM
}
