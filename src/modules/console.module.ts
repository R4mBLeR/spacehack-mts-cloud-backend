// src/console/console.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsoleSessionEntity } from '../models/console.entity';
import { VirtualMachine } from '../models/vm.entity';
import { ConsoleGateway } from '../gateways/console.gateway';
import { ConsoleService } from '../services/console.service';
import { ProxmoxService } from '../api/proxmox.service';
import { ConsoleSessionRepository } from '../repositories/console.session.repository';
import { VmConsoleRepository } from '../repositories/vm.console.repository';
import { ConsoleController } from '../controllers/console.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsoleSessionEntity, // <-- Должен быть здесь
      VirtualMachine,
    ]),
  ],
  controllers: [ConsoleController],
  providers: [
    ConsoleGateway,
    ConsoleService,
    ProxmoxService,
    ConsoleSessionRepository,
    VmConsoleRepository,
  ],
  exports: [ConsoleService],
})
export class ConsoleModule {}
