// database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../models/user.entity';
import { Session } from '../models/session.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'), // ❗ Должно быть из .env
        password: configService.get('DB_PASSWORD'), // ❗ Должно быть из .env
        database: configService.get('DB_DATABASE'),
        entities: [User, Session],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
