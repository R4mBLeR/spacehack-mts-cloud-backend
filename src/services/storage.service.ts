import { Injectable } from '@nestjs/common';
import { ProxmoxService } from '../api/proxmox.service';

const NODE = 'pve';

@Injectable()
export class StorageService {
  constructor(private readonly proxmox: ProxmoxService) {}

  /** Список хранилищ на ноде. */
  async listNodeStorages() {
    return this.proxmox.getNodeStorages(NODE);
  }

  /**
   * Содержимое хранилища.
   * contentType: 'iso' | 'vztmpl' | 'backup' | 'images' | 'rootdir'
   */
  async getStorageContent(storage: string, contentType?: string) {
    return this.proxmox.getStorageContent(NODE, storage, contentType);
  }

  /** Глобальный список storage из конфигурации кластера. */
  async listGlobal() {
    return this.proxmox.getGlobalStorages();
  }
}
