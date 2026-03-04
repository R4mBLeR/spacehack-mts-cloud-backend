import ProxmoxApi from 'proxmox-api';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

interface CreateVmConfig {
  node: string;
  vmid: number;
  name: string;
  memory?: number; // MB
  cores?: number;
  sockets?: number;
  cpu?: string; // "host", "kvm64", etc.
  ostype?: string; // "l26" - Linux, "win10" - Windows
  scsi0?: string; // "local-lvm:20" - диск 20GB
  ide2?: string; // "local:iso/debian.iso,media=cdrom"
  net0?: string; // "virtio,bridge=vmbr0"
  boot?: string; // "order=ide2;scsi0"
  [key: string]: any; // другие параметры Proxmox API
}

@Injectable()
export class ProxmoxService {
  private client: any;

  constructor() {
    this.client = ProxmoxApi({
      host: process.env.PROXMOX_HOST!,
      port: parseInt(process.env.PROXMOX_PORT!, 10),
      username: `${process.env.PROXMOX_USER!}!${process.env.PROXMOX_TOKEN_NAME!}`,
      password: process.env.PROXMOX_TOKEN_SECRET!,
    });

    console.log('🔥🔥🔥 PROXMOX CLIENT CREATED 🔥🔥🔥');
  }

  /**
   * Создаёт виртуальную машину
   * Возвращает Task ID (UPID) для отслеживания
   */
  async createVm(config: CreateVmConfig): Promise<string> {
    const { node, ...vmConfig } = config;

    try {
      console.log(this.client.client);
      const result = await this.client.nodes.$(node).qemu.$post(vmConfig);

      console.log(result);
      const taskId = result.data;
      console.log(`✅ VM creation started. Task ID: ${taskId}`);

      return taskId;
    } catch (error: any) {
      console.error('❌ Failed to create VM:', error.message);
      throw error;
    }
  }

  async waitForTask(
    node: string,
    taskId: string,
    intervalMs = 2000,
  ): Promise<void> {
    console.log(`⏳ Waiting for task ${taskId}...`);

    while (true) {
      const status = await this.client.nodes
        .$(node)
        .tasks.$(taskId)
        .status.$get();
      const state = status.data.status;

      if (state === 'stopped') {
        const exitStatus = status.data.exitstatus;
        if (exitStatus === 'OK') {
          console.log('✅ Task completed successfully');
          return;
        } else {
          throw new Error(`Task failed with exit status: ${exitStatus}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Создаёт ВМ и ждёт завершения
   */
  async createVmAndWait(config: CreateVmConfig): Promise<void> {
    const taskId = await this.createVm(config);
    await this.waitForTask(config.node, taskId);
  }
}
