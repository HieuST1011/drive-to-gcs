import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SyncConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // Store the userId directly

  @Column()
  folderId: string; // Google Drive folder ID

  @Column()
  syncStatus: string; // Status: "pending", "syncing", "completed", "error"
}
