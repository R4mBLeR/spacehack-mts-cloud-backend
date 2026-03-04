import ProxmoxApi from 'proxmox-api';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import https from 'https';

interface CreateVmConfig {
  node: string;
  vmid: number;
  name: string;
  memory?: number;
  cores?: number;
  sockets?: number;
  cpu?: string;
  ostype?: string;
  scsi0?: string;
  ide2?: string;
  net0?: string;
  boot?: string;

  [key: string]: any;
}

@Injectable()
export class ProxmoxService {
  private client: any;

  constructor() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = ProxmoxApi({
      host: process.env.PROXMOX_HOST!,
      port: parseInt(process.env.PROXMOX_PORT!, 10),
      username: `${process.env.PROXMOX_USER!}!${process.env.PROXMOX_TOKEN_NAME!}`,
      password: process.env.PROXMOX_PASSWORD!,
    });

    console.log('🔥🔥🔥 PROXMOX CLIENT CREATED 🔥🔥🔥');
  }

  /**
   * Создаёт виртуальную машину
   */
  async createVm(config: CreateVmConfig): Promise<string> {
    const { node, ...vmConfig } = config;

    try {
      const result = await this.client.nodes.$(node).qemu.$post(vmConfig);
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

  async createVmAndWait(config: CreateVmConfig): Promise<void> {
    const taskId = await this.createVm(config);
    await this.waitForTask(config.node, taskId);
  }
}
