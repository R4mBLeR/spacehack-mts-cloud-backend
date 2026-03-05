// src/console/repositories/vm-console.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualMachine } from '../models/vm.entity';

export interface VmConsoleInfo {
  id: number;
  proxmox_id: number;
  name?: string;
  status?: string; // Оставляем в интерфейсе, но убираем из select
}

@Injectable()
export class VmConsoleRepository {
  constructor(
    @InjectRepository(VirtualMachine)
    private readonly repo: Repository<VirtualMachine>,
  ) {}

  async findVmById(id: number): Promise<VmConsoleInfo | null> {
    const vm = await this.repo.findOne({
      where: { id },
      select: ['id', 'proxmox_id', 'name'], // Убран 'status'
    });
    return vm || null;
  }

  async findByProxmoxId(proxmoxId: number): Promise<VmConsoleInfo | null> {
    const vm = await this.repo.findOne({
      where: { proxmox_id: proxmoxId },
      select: ['id', 'proxmox_id', 'name'], // Убран 'status'
    });
    return vm || null;
  }
}
