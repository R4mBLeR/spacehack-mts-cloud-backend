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
    await this.client.post(`/nodes/${node}/qemu/${vmid}/status/reboot`, '', {
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

  // ── Console / Terminal ──────────────────────────────────

  /**
   * Получить VNC ticket для VM (QEMU).
   * Proxmox вернёт { ticket, port, user, upid, cert }.
   */
  async getVmTermTicket(
    node: string,
    vmid: number,
  ): Promise<{ ticket: string; port: number }> {
    const { data } = await this.client.post(
      `/nodes/${node}/qemu/${vmid}/vncproxy`,
      new URLSearchParams({ websocket: '1' }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return { ticket: data.data.ticket, port: data.data.port };
  }

  /**
   * Получить VNC ticket для LXC-контейнера.
   */
  async getLxcTermTicket(
    node: string,
    vmid: number,
  ): Promise<{ ticket: string; port: number }> {
    const { data } = await this.client.post(
      `/nodes/${node}/lxc/${vmid}/vncproxy`,
      new URLSearchParams({ websocket: '1' }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return { ticket: data.data.ticket, port: data.data.port };
  }

  /**
   * Построить URL для вебсокета Proxmox VNC.
   */
  buildVncWebSocketUrl(node: string, vmid: number, port: number, ticket: string, type: 'qemu' | 'lxc' = 'qemu'): string {
    const host = process.env.PROXMOX_HOST!;
    const pvePort = process.env.PROXMOX_PORT!;
    return `wss://${host}:${pvePort}/api2/json/nodes/${node}/${type}/${vmid}/vncwebsocket?port=${port}&vncticket=${encodeURIComponent(ticket)}`;
  }

  // ─── RBAC: Roles ───────────────────────────────────────────

  /**
   * Получить список всех ролей Proxmox.
   */
  async getRoles(): Promise<any[]> {
    const { data } = await this.client.get('/access/roles');
    return data.data;
  }

  /**
   * Получить конкретную роль по ID.
   */
  async getRole(roleid: string): Promise<any> {
    const { data } = await this.client.get(`/access/roles/${encodeURIComponent(roleid)}`);
    return data.data;
  }

  /**
   * Создать новую роль в Proxmox.
   * @param roleid  — уникальное имя роли
   * @param privs   — строка привилегий через запятую, напр. "VM.Audit,VM.Console"
   */
  async createRole(roleid: string, privs: string): Promise<void> {
    await this.client.post(
      '/access/roles',
      new URLSearchParams({ roleid, privs }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  }

  /**
   * Обновить привилегии существующей роли.
   * @param append — если true, привилегии добавляются к существующим
   */
  async updateRole(roleid: string, privs: string, append = false): Promise<void> {
    const params: Record<string, string> = { privs };
    if (append) params.append = '1';
    await this.client.put(
      `/access/roles/${encodeURIComponent(roleid)}`,
      new URLSearchParams(params).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  }

  /**
   * Удалить роль из Proxmox.
   */
  async deleteRole(roleid: string): Promise<void> {
    await this.client.delete(`/access/roles/${encodeURIComponent(roleid)}`);
  }

  // ─── RBAC: Users ───────────────────────────────────────────

  /**
   * Получить список всех пользователей Proxmox.
   */
  async getPveUsers(enabled?: boolean): Promise<any[]> {
    const params: Record<string, string> = {};
    if (enabled !== undefined) params.enabled = enabled ? '1' : '0';
    const { data } = await this.client.get('/access/users', { params });
    return data.data;
  }

  /**
   * Получить конкретного пользователя Proxmox.
   * @param userid — формат "user@realm", напр. "admin@pve"
   */
  async getPveUser(userid: string): Promise<any> {
    const { data } = await this.client.get(`/access/users/${encodeURIComponent(userid)}`);
    return data.data;
  }

  /**
   * Создать пользователя в Proxmox.
   */
  async createPveUser(params: {
    userid: string;
    password?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    groups?: string;
    comment?: string;
    enable?: boolean;
  }): Promise<void> {
    const body: Record<string, string> = { userid: params.userid };
    if (params.password) body.password = params.password;
    if (params.email) body.email = params.email;
    if (params.firstname) body.firstname = params.firstname;
    if (params.lastname) body.lastname = params.lastname;
    if (params.groups) body.groups = params.groups;
    if (params.comment) body.comment = params.comment;
    if (params.enable !== undefined) body.enable = params.enable ? '1' : '0';
    await this.client.post(
      '/access/users',
      new URLSearchParams(body).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  }

  /**
   * Обновить пользователя в Proxmox.
   */
  async updatePveUser(userid: string, params: {
    email?: string;
    firstname?: string;
    lastname?: string;
    groups?: string;
    comment?: string;
    enable?: boolean;
  }): Promise<void> {
    const body: Record<string, string> = {};
    if (params.email) body.email = params.email;
    if (params.firstname) body.firstname = params.firstname;
    if (params.lastname) body.lastname = params.lastname;
    if (params.groups) body.groups = params.groups;
    if (params.comment) body.comment = params.comment;
    if (params.enable !== undefined) body.enable = params.enable ? '1' : '0';
    await this.client.put(
      `/access/users/${encodeURIComponent(userid)}`,
      new URLSearchParams(body).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  }

  /**
   * Удалить пользователя из Proxmox.
   */
  async deletePveUser(userid: string): Promise<void> {
    await this.client.delete(`/access/users/${encodeURIComponent(userid)}`);
  }

  // ─── RBAC: ACL ─────────────────────────────────────────────

  /**
   * Получить текущие ACL-записи Proxmox.
   */
  async getAcl(): Promise<any[]> {
    const { data } = await this.client.get('/access/acl');
    return data.data;
  }

  /**
   * Назначить ACL — привязать роль к пользователю/группе на указанном пути.
   * @param path   — путь ресурса, напр. "/vms/100", "/storage/local"
   * @param roles  — роль(и) через запятую
   * @param users  — пользователь(и) "user@realm" через запятую (или groups)
   * @param propagate — распространять ли вниз по дереву (по умолчанию true)
   */
  async updateAcl(params: {
    path: string;
    roles: string;
    users?: string;
    groups?: string;
    propagate?: boolean;
    delete?: boolean;
  }): Promise<void> {
    const body: Record<string, string> = {
      path: params.path,
      roles: params.roles,
    };
    if (params.users) body.users = params.users;
    if (params.groups) body.groups = params.groups;
    if (params.propagate !== undefined) body.propagate = params.propagate ? '1' : '0';
    if (params.delete) body.delete = '1';
    await this.client.put(
      '/access/acl',
      new URLSearchParams(body).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  }
}
