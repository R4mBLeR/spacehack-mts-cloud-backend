import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthUtils } from '../utils/auth.utils';
import { Corporation } from '../models/corporation.entity';
import { CorporationController } from '../controllers/corporation.controller';
import { CorporationService } from '../services/corporation.service';
import { CorporationRepository } from '../repositories/corporation.repository';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Corporation, User])],
  controllers: [CorporationController],
  providers: [
    CorporationService,
    CorporationRepository,
    UserRepository,
    JwtService,
    AuthUtils,
  ],
  exports: [CorporationService, CorporationRepository, UserRepository],
})
export class CorporationModule {}
