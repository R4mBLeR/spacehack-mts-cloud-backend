import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthUtils } from '../utils/auth.utils';
import { Corporation } from '../models/corporation.entity';
import { CorporationController } from '../controllers/corporation.controller';
import { CorporationService } from '../services/corporation.service';
import { CorporationRepository } from '../repositories/corporation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Corporation])],
  controllers: [CorporationController],
  providers: [CorporationService, CorporationRepository, JwtService, AuthUtils],
  exports: [CorporationService, CorporationRepository],
})
export class CorporationModule {}
