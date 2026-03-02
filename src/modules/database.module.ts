// database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../models/user.entity';
import { Session } from '../models/session.entity';
import { Role } from '../models/role.entity';
import { Permission } from '../models/permission.entity';
import { VirtualMachine } from '../models/vm.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'mts_db'),
        entities: [User, Role, Permission, Session, VirtualMachine],
        autoLoadEntities: true,
        synchronize:
          String(configService.get('TYPEORM_SYNCHRONIZE')) === 'true',
        logging: String(configService.get('TYPEORM_LOGGING')) === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
