import { Injectable, NotFoundException } from '@nestjs/common';
import { ProxmoxService } from '../api/proxmox.service';
import { VmRepository } from '../repositories/vm.repository';
import { CreateLxcDto } from '../dto/lxc/create-lxc.dto';
import { UpdateLxcDto } from '../dto/lxc/update-lxc.dto';

const NODE = 'pve';
// Шаблон LXC по умолчанию (debian 12 в local:vztmpl)
const DEFAULT_TEMPLATE = 'local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst';
const DEFAULT_BRIDGE = process.env.PROXMOX_DEFAULT_BRIDGE || 'vnet10';

@Injectable()
export class LxcService {
  constructor(
    private readonly proxmox: ProxmoxService,
    private readonly vmRepository: VmRepository,
  ) {}

  /** Список LXC на ноде (Proxmox). */
  async listAll() {
    return this.proxmox.getLxcList(NODE);
  }

  /** Статус конкретного LXC по его proxmox_id. */
  async getStatus(proxmoxId: number) {
    return this.proxmox.getLxcStatus(NODE, proxmoxId);
  }

  /** Конфигурация LXC. */
  async getConfig(proxmoxId: number) {
    return this.proxmox.getLxcConfig(NODE, proxmoxId);
  }

  /** RRD метрики LXC. */
  async getMonitoring(proxmoxId: number, timeframe = 'hour', cf = 'AVERAGE') {
    return this.proxmox.getLxcRrdData(NODE, proxmoxId, timeframe, cf);
  }

  /**
   * Создать LXC-контейнер.
   * VMID выделяется из общего счётчика (как у QEMU VM).
   */
  async create(dto: CreateLxcDto, userId: number): Promise<{ proxmoxId: number; taskId: string }> {
    const vmid = await this.vmRepository.getNextVmid();

    const taskId = await this.proxmox.createLxc(NODE, {
      vmid,
      hostname: dto.hostname,
      ostemplate: dto.ostemplate ?? DEFAULT_TEMPLATE,
      memory: dto.memory,
      cores: dto.cores,
      rootfs: dto.rootfs ?? 'local-lvm:8',
      password: dto.password,
      sshPublicKeys: dto.sshPublicKeys,
      net0: dto.net0 ?? `name=eth0,bridge=${DEFAULT_BRIDGE},ip=dhcp`,
      unprivileged: dto.unprivileged ?? true,
      start: dto.start ?? false,
    });

    // Сохраняем в БД (та же таблица, что и QEMU VM)
    await this.vmRepository.createVm(
      { name: dto.hostname, configuration: {} as any },
      userId,
      vmid,
    );

    return { proxmoxId: vmid, taskId };
  }

  async updateConfig(proxmoxId: number, dto: UpdateLxcDto) {
    await this.proxmox.updateLxcConfig(NODE, proxmoxId, {
      memory: dto.memory,
      cores: dto.cores,
      hostname: dto.hostname,
      description: dto.description,
    });
    return { message: 'Config updated' };
  }

  async start(proxmoxId: number) {
    const taskId = await this.proxmox.startLxc(NODE, proxmoxId);
    return { taskId };
  }

  async stop(proxmoxId: number) {
    const taskId = await this.proxmox.stopLxc(NODE, proxmoxId);
    return { taskId };
  }

  async shutdown(proxmoxId: number) {
    const taskId = await this.proxmox.shutdownLxc(NODE, proxmoxId);
    return { taskId };
  }

  async reboot(proxmoxId: number) {
    const taskId = await this.proxmox.rebootLxc(NODE, proxmoxId);
    return { taskId };
  }

  async delete(proxmoxId: number) {
    const taskId = await this.proxmox.deleteLxc(NODE, proxmoxId);
    return { taskId };
  }
}
