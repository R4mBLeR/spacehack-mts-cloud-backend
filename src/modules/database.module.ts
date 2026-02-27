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
        const sync = configService.get('TYPEORM_SYNCHRONIZE');
        const logging = configService.get('TYPEORM_LOGGING');
        
        logger.log(`DB Host: ${configService.get('DB_HOST')}`);
        logger.log(`TypeORM Sync: ${sync} (type: ${typeof sync})`);
        
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'postgres'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'mts_db'),
          entities: [User, Role, Permission, Session],
          autoLoadEntities: true,
          synchronize: String(sync) === 'true',
          logging: String(logging) === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
