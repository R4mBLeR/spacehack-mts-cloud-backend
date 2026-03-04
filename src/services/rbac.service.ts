import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProxmoxService } from '../api/proxmox.service';

@Injectable()
export class RbacService {
  constructor(private readonly proxmox: ProxmoxService) {}

  // ─── Roles ─────────────────────────────────────────────────

  async listRoles() {
    return this.proxmox.getRoles();
  }

  async getRole(roleid: string) {
    try {
      return await this.proxmox.getRole(roleid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Role "${roleid}" not found in Proxmox`);
      }
      throw err;
    }
  }

  async createRole(roleid: string, privs: string) {
    try {
      await this.proxmox.createRole(roleid, privs);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        throw new BadRequestException(
          err?.response?.data?.errors ?? `Failed to create role "${roleid}"`,
        );
      }
      throw err;
    }
    return { message: `Role "${roleid}" created` };
  }

  async updateRole(roleid: string, privs: string, append = false) {
    try {
      await this.proxmox.updateRole(roleid, privs, append);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Role "${roleid}" not found`);
      }
      throw err;
    }
    return { message: `Role "${roleid}" updated` };
  }

  async deleteRole(roleid: string) {
    try {
      await this.proxmox.deleteRole(roleid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Role "${roleid}" not found`);
      }
      throw err;
    }
    return { message: `Role "${roleid}" deleted` };
  }

  // ─── Users ─────────────────────────────────────────────────

  async listPveUsers(enabled?: boolean) {
    return this.proxmox.getPveUsers(enabled);
  }

  async getPveUser(userid: string) {
    try {
      return await this.proxmox.getPveUser(userid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`PVE user "${userid}" not found`);
      }
      throw err;
    }
  }

  async createPveUser(params: {
    userid: string;
    password?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    groups?: string;
    comment?: string;
    enable?: boolean;
  }) {
    try {
      await this.proxmox.createPveUser(params);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        throw new BadRequestException(
          err?.response?.data?.errors ?? `Failed to create PVE user "${params.userid}"`,
        );
      }
      throw err;
    }
    return { message: `PVE user "${params.userid}" created` };
  }

  async updatePveUser(userid: string, params: {
    email?: string;
    firstname?: string;
    lastname?: string;
    groups?: string;
    comment?: string;
    enable?: boolean;
  }) {
    try {
      await this.proxmox.updatePveUser(userid, params);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`PVE user "${userid}" not found`);
      }
      throw err;
    }
    return { message: `PVE user "${userid}" updated` };
  }

  async deletePveUser(userid: string) {
    try {
      await this.proxmox.deletePveUser(userid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`PVE user "${userid}" not found`);
      }
      throw err;
    }
    return { message: `PVE user "${userid}" deleted` };
  }

  // ─── ACL ───────────────────────────────────────────────────

  async listAcl() {
    return this.proxmox.getAcl();
  }

  async updateAcl(params: {
    path: string;
    roles: string;
    users?: string;
    groups?: string;
    propagate?: boolean;
    delete?: boolean;
  }) {
    if (!params.users && !params.groups) {
      throw new BadRequestException('Either "users" or "groups" must be specified');
    }
    try {
      await this.proxmox.updateAcl(params);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        throw new BadRequestException(
          err?.response?.data?.errors ?? 'Failed to update ACL',
        );
      }
      throw err;
    }
    return { message: 'ACL updated' };
  }
}
