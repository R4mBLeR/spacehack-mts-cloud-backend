import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../modules/users.module';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { AuthUtils } from '../utils/auth.utils';
import { SessionRepository } from '../repositories/session.repository';
import { Session } from '../models/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUtils, SessionRepository],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}
