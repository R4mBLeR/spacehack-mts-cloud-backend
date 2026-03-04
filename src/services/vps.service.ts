import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VmRepository } from '../repositories/vm.repository';
import { VirtualMachine, VmStatus } from '../models/vm.entity';
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

  async findOne(id: number): Promise<VirtualMachine> {
    const vm = await this.vmRepository.findVmById(id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
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
    const vmid = await this.vmRepository.getNextVmid();

    const upid = await this.proxmox.createVm({
      node: 'pve',
      vmid,
      name: createVmDto.name,
      memory: createVmDto.configuration.ram,
      cores: createVmDto.configuration.cpu,
      scsi0: `local-lvm:${createVmDto.configuration.ssd}`,
      net0: `virtio,bridge=vmbr0`,
    });

    await this.proxmox.waitForTask('pve1', upid);

    // Передаём vmid в репозиторий для сохранения
    return this.vmRepository.createVm(createVmDto, userId, vmid);
  }

  async stop(user_id: number, stopVmDto: ChangeVmStatusDto): Promise<boolean> {
    const vm = await this.vmRepository.findVmById(stopVmDto.id);
    if (!vm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }
    if (vm.user_id !== user_id) {
      throw new NotFoundException('VIRTUAL_MACHINE_NO_ACCESS');
    }
    const result = await this.vmRepository.changeVmStatus(vm, VmStatus.STOPPED);
    if (result) {
      return true;
    }
    return false;
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
    const result = await this.vmRepository.deleteVmById(deleteVmDto.id);
    if (result.affected === 0) {
      return false;
    }
    return true;
  }

  async update(id: number, updateVmDto: UpdateVmDto): Promise<VirtualMachine> {
    const existingVm = await this.vmRepository.findVmById(id);
    if (!existingVm) {
      throw new NotFoundException('VIRTUAL_MACHINE_NOT_FOUND');
    }

    const changedFields = Object.keys(updateVmDto).filter(
      (key) =>
        updateVmDto[key] !== undefined && existingVm[key] !== updateVmDto[key],
    );

    if (!changedFields.length) {
      throw new BadRequestException('NO_DATA_TO_UPDATE');
    }

    changedFields.forEach((key) => {
      existingVm[key] = updateVmDto[key];
    });

    return this.vmRepository.save(existingVm);
  }
}
