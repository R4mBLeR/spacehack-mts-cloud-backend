// repositories/user.repository.ts - Только работа с БД
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { VirtualMachine, VmStatus } from '../models/vm.entity';
import { CreateVmDto } from '../dto/create-vm.dto';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class VmRepository {
  constructor(
    @InjectRepository(VirtualMachine)
    private readonly repository: Repository<VirtualMachine>,
  ) {}

  async findAllMachines(): Promise<VirtualMachine[]> {
    return this.repository.find();
  }

  async findAllVm(): Promise<VirtualMachine[]> {
    return this.repository.find();
  }

  async findVmById(id: number): Promise<VirtualMachine | null> {
    return this.repository.findOneBy({ id });
  }

  async findVmsByUserId(userId: number): Promise<VirtualMachine[] | null> {
    return this.repository.findBy({ user_id: userId });
  }

  async createVm(
    createUserDto: CreateVmDto,
    userId: number,
    vmId: number,
  ): Promise<VirtualMachine> {
    const vm = this.repository.create(createUserDto);
    vm.user_id = userId;
    vm.proxmox_id = vmId;
    return this.repository.save(vm);
  }

  async deleteVmById(id: number): Promise<DeleteResult> {
    return this.repository.delete({ id });
  }

  async save(vm: VirtualMachine): Promise<VirtualMachine> {
    return this.repository.save(vm);
  }

  async getNextVmid(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('vm')
      .select('MAX(vm.proxmox_id)', 'max')
      .getRawOne();

    return (result?.max || 100) + 1;
  }
}
