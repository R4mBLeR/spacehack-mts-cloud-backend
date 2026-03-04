import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { Injectable } from '@nestjs/common';

enum SystemTemplates {
  ARCH = 900,
  ALPINE = 901,
}

interface UpdateVmConfig {
  memory?: number;
  cores?: number;
  diskSize?: number;
}

interface CreateVmConfig {
  node: string;
  vmid: number;
  name: string;
  memory?: number;
  cores?: number;
  diskSize?: number;
  ciuser?: string;
  cipassword?: string;
  sshkeys?: string;
  ipconfig0?: string;
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
  }

  async createVmFull(config: CreateVmConfig): Promise<void> {
    const node = config.node || 'pve';
    const vmid = config.vmid;

    const taskId = await this.createVm(config);
    await this.waitForTask(node, taskId);

    const vmConfig = await this.getVmConfig(node, vmid);
    const diskKey = this.findDiskKey(vmConfig);

    if (!diskKey) {
      throw new Error('Cloned VM has no disk');
    }

    const updates: any = {
      boot: `order=${diskKey}`,
    };

    if (config.memory) updates.memory = config.memory.toString();
    if (config.cores) updates.cores = config.cores.toString();

    await this.updateVmConfig(node, vmid, updates);

    if (config.diskSize) {
      await this.resizeDisk(node, vmid, diskKey, config.diskSize);
    }

    if (
      config.ciuser ||
      config.cipassword ||
      config.sshkeys ||
      config.ipconfig0
    ) {
      await this.configureCloudInit(node, vmid, config);
    }

    await this.startVm(node, vmid);
  }

  async createVm(config: CreateVmConfig): Promise<string> {
    const params = {
      newid: config.vmid.toString(),
      name: config.name,
      full: '1',
      target: config.node || 'pve',
    };

    const res = await this.client.post(
      `/nodes/${config.node || 'pve'}/qemu/${SystemTemplates.ALPINE}/clone`,
      new URLSearchParams(params).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    return res.data.data;
  }

  async getVmConfig(node: string, vmid: number): Promise<any> {
    const { data } = await this.client.get(
      `/nodes/${node}/qemu/${vmid}/config`,
    );
    return data.data;
  }

  private findDiskKey(config: any): string | null {
    const keys = Object.keys(config).filter((k) =>
      /^(scsi|virtio|sata|ide)\d+$/.test(k),
    );
    return keys[0] || null;
  }

  async updateVmConfig(node: string, vmid: number, params: any): Promise<void> {
    await this.client.post(
      `/nodes/${node}/qemu/${vmid}/config`,
      new URLSearchParams(params).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
  }

  async resizeDisk(
    node: string,
    vmid: number,
    disk: string,
    sizeMB: number,
  ): Promise<void> {
    await this.client.put(
      `/nodes/${node}/qemu/${vmid}/resize`,
      new URLSearchParams({
        disk: disk,
        size: `${sizeMB}M`,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
  }

  async configureCloudInit(
    node: string,
    vmid: number,
    config: CreateVmConfig,
  ): Promise<void> {
    const params: any = {};

    if (config.ciuser) params.ciuser = config.ciuser;
    if (config.cipassword) params.cipassword = config.cipassword;
    if (config.sshkeys)
      params.sshkeys = Buffer.from(config.sshkeys).toString('base64');
    if (config.ipconfig0) params.ipconfig0 = config.ipconfig0;

    await this.updateVmConfig(node, vmid, params);
  }

  async waitForTask(
    node: string,
    taskId: string,
    intervalMs = 2000,
  ): Promise<void> {
    while (true) {
      const { data } = await this.client.get(
        `/nodes/${node}/tasks/${taskId}/status`,
      );
      const status = data.data;

      if (status.status === 'stopped') {
        if (status.exitstatus === 'OK') return;
        throw new Error(`Task failed: ${status.exitstatus}`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  async getVmStatus(node: string, vmid: number) {
    const { data } = await this.client.get(
      `/nodes/${node}/qemu/${vmid}/status/current`,
    );
    return data.data;
  }

  async startVm(node: string, vmid: number) {
    await this.client.post(`/nodes/${node}/qemu/${vmid}/status/start`, '', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async stopVm(node: string, vmid: number) {
    await this.client.post(`/nodes/${node}/qemu/${vmid}/status/stop`, '', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async restartVm(node: string, vmid: number) {
    await this.client.post(`/nodes/${node}/qemu/${vmid}/status/restart`, '', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async shutdownVm(node: string, vmid: number) {
    await this.client.post(`/nodes/${node}/qemu/${vmid}/status/shutdown`, '', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async deleteVm(node: string, vmid: number) {
    await this.client.delete(`/nodes/${node}/qemu/${vmid}`);
  }

  async updateVm(
    node: string,
    vmid: number,
    config: UpdateVmConfig,
  ): Promise<void> {
    const updates: any = {};

    if (config.memory) updates.memory = config.memory.toString();
    if (config.cores) updates.cores = config.cores.toString();

    await this.updateVmConfig('pve', vmid, updates);
    const vmConfig = await this.getVmConfig(node, vmid);
    const diskKey = this.findDiskKey(vmConfig);

    if (!diskKey) {
      throw new Error('Cloned VM has no disk');
    }

    if (config.diskSize) {
      await this.resizeDisk(node, vmid, diskKey, config.diskSize);
    }
  }
}
