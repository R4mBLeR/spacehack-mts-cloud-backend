import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { VirtualMachine } from '../models/vm.entity';
import { VmRepository } from '../repositories/vm.repository';
import { VpsService } from '../services/vps.service';
import { AuthUtils } from '../utils/auth.utils';
import { VpsController } from '../controllers/vps.controller';
// Убери эту строку:
// import { Proxmox } from 'proxmox-api';
import { ProxmoxService } from '../api/proxmox.service';
import { ConsoleGateway } from '../gateways/console.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualMachine])],
  controllers: [VpsController],
  providers: [VpsService, VmRepository, JwtService, AuthUtils, ProxmoxService, ConsoleGateway],
  exports: [VpsService, VmRepository, ProxmoxService],
})
export class VpsModule {}
