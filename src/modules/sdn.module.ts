import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SdnController } from '../controllers/sdn.controller';
import { ProxmoxService } from '../api/proxmox.service';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  controllers: [SdnController],
  providers: [ProxmoxService, JwtService, AuthUtils],
})
export class SdnModule {}
