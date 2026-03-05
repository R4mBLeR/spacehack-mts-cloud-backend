import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProxmoxService } from '../api/proxmox.service';
import { CreatePoolDto, UpdatePoolDto } from '../dto/pool/pool.dto';

@Injectable()
export class PoolsService {
  constructor(private readonly proxmox: ProxmoxService) {}

  async listPools() {
    return this.proxmox.listPools();
  }

  async getPool(poolid: string) {
    try {
      return await this.proxmox.getPool(poolid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Pool "${poolid}" not found`);
      }
      throw err;
    }
  }

  async createPool(dto: CreatePoolDto) {
    try {
      await this.proxmox.createPool(dto.poolid, dto.comment);
    } catch (err: any) {
      if (err?.response?.status === 400) {
        throw new BadRequestException(
          err?.response?.data?.errors ?? `Failed to create pool "${dto.poolid}"`,
        );
      }
      throw err;
    }
    return { message: `Pool "${dto.poolid}" created` };
  }

  async updatePool(poolid: string, dto: UpdatePoolDto) {
    try {
      await this.proxmox.updatePool(poolid, {
        vms: dto.vms,
        storage: dto.storage,
        comment: dto.comment,
        delete: dto.delete,
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Pool "${poolid}" not found`);
      }
      throw err;
    }
    return { message: `Pool "${poolid}" updated` };
  }

  async deletePool(poolid: string) {
    try {
      await this.proxmox.deletePool(poolid);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new NotFoundException(`Pool "${poolid}" not found`);
      }
      throw err;
    }
    return { message: `Pool "${poolid}" deleted` };
  }
}
