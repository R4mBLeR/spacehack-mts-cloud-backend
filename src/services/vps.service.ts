import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VmRepository } from '../repositories/vm.repository';
import { VirtualMachine } from '../models/vm.entity';
import { CreateVmDto } from '../dto/create-vm.dto';
import { UpdateVmDto } from '../dto/update-vm.dto';
import { ChangeVmStatusDto } from '../dto/change.vm.status.dto';
import { ProxmoxService } from '../api/proxmox.service';

@Injectable()
export class VpsService {
  constructor(
    private vmRepository: VmRepository,
    private readonly proxmox: ProxmoxService,
  ) {}

  async findAll(): Promise<VirtualMachine[]> {
    return this.vmRepository.findAllMachines();
  }

  async findOne(id: number, userId?: number): Promise<VirtualMachine> {
    const vm = await this.vmRepository.findVmById(id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (userId !== undefined && vm.user_id !== userId) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    return vm;
  }

  async findByUserId(id: number): Promise<VirtualMachine[]> {
    const vm = await this.vmRepository.findVmsByUserId(id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINES_NOT_FOUND');
    }
    return vm;
  }

  async create(
    createVmDto: CreateVmDto,
    userId: number,
  ): Promise<VirtualMachine> {
    // Валидация имени
    if (createVmDto.name.includes(' ')) {
      throw new BadRequestException('INCORRECT_VIRTUAL_MACHINE_NAME');
    }

    const vmid = await this.vmRepository.getNextVmid();
    console.log('New VMID:', vmid);

    const node = 'pve';

    await this.proxmox.createVmFull({
      node,
      vmid,
      name: createVmDto.name,
      memory: createVmDto.configuration.ram,
      cores: createVmDto.configuration.cpu,
      diskSize: createVmDto.configuration.ssd,
      ciuser: 'admin', // или из DTO
      cipassword: 'admin', // или из DTO
      // Сеть через cloud-init
      ipconfig0: 'ip=dhcp', // или конкретный IP
    });

    return this.vmRepository.createVm(createVmDto, userId, vmid);
  }

  async stop(user_id: number, stopVmDto: ChangeVmStatusDto): Promise<void> {
    const vm = await this.vmRepository.findVmById(stopVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    return await this.proxmox.stopVm('pve', vm.proxmox_id);
  }

  async start(user_id: number, stopVmDto: ChangeVmStatusDto): Promise<void> {
    const vm = await this.vmRepository.findVmById(stopVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    return await this.proxmox.startVm('pve', vm.proxmox_id);
  }

  async restart(
    user_id: number,
    restartVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    const vm = await this.vmRepository.findVmById(restartVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    return await this.proxmox.restartVm('pve', vm.proxmox_id);
  }

  async shutdownVm(
    user_id: number,
    shutdownVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    const vm = await this.vmRepository.findVmById(shutdownVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    return await this.proxmox.shutdownVm('pve', vm.proxmox_id);
  }

  async delete(
    user_id: number,
    deleteVmDto: ChangeVmStatusDto,
  ): Promise<boolean> {
    const vm = await this.vmRepository.findVmById(deleteVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    await this.proxmox.deleteVm('pve', vm.proxmox_id);
    const result = await this.vmRepository.deleteVmById(deleteVmDto.id);
    if (result.affected === 0) {
      return false;
    }
    await this.proxmox.deleteVm('pve', vm.proxmox_id);
    await this.vmRepository.deleteVmById(deleteVmDto.id);
    return true;
  }

  async updateVm(userId: number, dto: UpdateVmDto): Promise<VirtualMachine> {
    const vm = await this.vmRepository.findVmById(dto.id);

    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== userId) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }

    const node = 'pve';

    await this.proxmox.updateVm(node, vm.proxmox_id, {
      memory: dto.configuration.ram,
      cores: dto.configuration.cpu,
      diskSize: dto.configuration.ssd,
    });

    return vm;
  }
}
