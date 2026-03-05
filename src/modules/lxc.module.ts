import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { LxcController } from '../controllers/lxc.controller';
import { LxcService } from '../services/lxc.service';
import { ProxmoxService } from '../api/proxmox.service';
import { VmRepository } from '../repositories/vm.repository';
import { VirtualMachine } from '../models/vm.entity';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualMachine])],
  controllers: [LxcController],
  providers: [LxcService, ProxmoxService, VmRepository, JwtService, AuthUtils],
  exports: [LxcService],
})
export class LxcModule {}
