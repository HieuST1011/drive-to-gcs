import { Module } from '@nestjs/common';
import { AuthModule } from './core/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './typeorm/entities/User';
import { PassportModule } from '@nestjs/passport';
import { DriveModule } from './core/drive/drive.module';
import { FolderConfiguration } from './typeorm/entities/FolderConfiguration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [User, FolderConfiguration],
      synchronize: true,
    }),
    AuthModule,
    DriveModule,
    PassportModule.register({ session: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
