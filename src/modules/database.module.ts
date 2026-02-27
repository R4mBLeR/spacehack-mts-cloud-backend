// database/database.module.ts
import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../models/user.entity';
import { Session } from '../models/session.entity';
import { Role } from '../models/role.entity';
import { Permission } from '../models/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        
        // Берем из конфига или напрямую из process.env для надежности
        const syncValue = configService.get('TYPEORM_SYNCHRONIZE') ?? process.env.TYPEORM_SYNCHRONIZE;
        const loggingValue = configService.get('TYPEORM_LOGGING') ?? process.env.TYPEORM_LOGGING;
        
        logger.log(`DB Host: ${configService.get('DB_HOST') || process.env.DB_HOST}`);
        logger.log(`TypeORM Sync (Value): ${syncValue}`);
        
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'postgres'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'mts_db'),
          entities: [User, Role, Permission, Session],
          autoLoadEntities: true,
          synchronize: String(syncValue) === 'true',
          logging: String(loggingValue) === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
