// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../modules/users.module';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthUtils } from '../utils/auth.utils';
import { SessionRepository } from '../repositories/session.repository';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'piskka',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthUtils, SessionRepository],
  exports: [AuthService, SessionRepository],
})
export class AuthModule {}
