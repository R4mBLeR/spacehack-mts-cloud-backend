import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { DatabaseModule } from './database.module';
import { UsersModule } from './users.module';
import { AuthModule } from './auth.module';
import { VpsModule } from './vps.module';
import { TicketsModule } from './tickets.module';
import { CorporationModule } from './corporation.module';
import { RbacModule } from './rbac.module';
import { ConsoleModule } from './console.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    VpsModule,
    TicketsModule,
    CorporationModule,
    AuthModule,
    RbacModule,
    ConsoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
