import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { VirtualMachine } from '../models/vm.entity';
import { VmRepository } from '../repositories/vm.repository';
import { VpsService } from '../services/vps.service';
import { AuthUtils } from '../utils/auth.utils';
import { VpsController } from '../controllers/vps.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualMachine])],
  controllers: [VpsController],
  providers: [VpsService, VmRepository, JwtService, AuthUtils],
  exports: [VpsService, VmRepository],
})
export class VpsModule {}
