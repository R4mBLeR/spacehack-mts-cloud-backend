import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { Injectable } from '@nestjs/common';

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
  private client: AxiosInstance;

  constructor() {
    const host = process.env.PROXMOX_HOST!;
    const port = process.env.PROXMOX_PORT!;
    const user = process.env.PROXMOX_USER!;
    const tokenName = process.env.PROXMOX_TOKEN_NAME!;
    const tokenSecret = process.env.PROXMOX_TOKEN_SECRET!;

    this.client = axios.create({
      baseURL: `https://${host}:${port}/api2/json`,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        Authorization: `PVEAPIToken=${user}!${tokenName}=${tokenSecret}`,
      },
      timeout: 30000,
    });

    console.log('🔥 PROXMOX CLIENT CREATED');
  }

  async createVm(config: CreateVmConfig): Promise<string> {
    const { node, ...vmConfig } = config;

    try {
      const { data } = await this.client.post(`/nodes/${node}/qemu`, vmConfig);
      console.log(`✅ VM creation started. Task ID: ${data.data}`);
      return data.data;
    } catch (error: any) {
      console.error(
        '❌ Failed to create VM:',
        error.response?.data?.message || error.message,
      );
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
      const { data } = await this.client.get(
        `/nodes/${node}/tasks/${taskId}/status`,
      );
      const status = data.data;

      if (status.status === 'stopped') {
        if (status.exitstatus === 'OK') {
          console.log('✅ Task completed successfully');
          return;
        }
        throw new Error(`Task failed: ${status.exitstatus}`);
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  async createVmAndWait(config: CreateVmConfig): Promise<void> {
    const taskId = await this.createVm(config);
    await this.waitForTask(config.node, taskId);
  }

  async getVmStatus(node: string, vmid: number) {
    const { data } = await this.client.get(
      `/nodes/${node}/qemu/${vmid}/status/current`,
    );
    return data.data;
  }

  async startVm(node: string, vmid: number) {
    const { data } = await this.client.post(
      `/nodes/${node}/qemu/${vmid}/status/start`,
    );
    return data.data;
  }

  async stopVm(node: string, vmid: number) {
    const { data } = await this.client.post(
      `/nodes/${node}/qemu/${vmid}/status/stop`,
    );
    return data.data;
  }

  async deleteVm(node: string, vmid: number) {
    const { data } = await this.client.delete(`/nodes/${node}/qemu/${vmid}`);
    return data.data;
  }
}
