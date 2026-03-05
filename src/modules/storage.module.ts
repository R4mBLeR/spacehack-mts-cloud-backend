import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StorageController } from '../controllers/storage.controller';
import { StorageService } from '../services/storage.service';
import { ProxmoxService } from '../api/proxmox.service';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  controllers: [StorageController],
  providers: [StorageService, ProxmoxService, JwtService, AuthUtils],
  exports: [StorageService],
})
export class StorageModule {}
