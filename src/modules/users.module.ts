import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../models/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UsersService } from '../services/users.service';
import { UsersController } from '../controllers/users.controller';
import { JwtService } from '@nestjs/jwt';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, JwtService, AuthUtils],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
