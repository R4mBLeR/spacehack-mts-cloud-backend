import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RbacController } from '../controllers/rbac.controller';
import { RbacService } from '../services/rbac.service';
import { ProxmoxService } from '../api/proxmox.service';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  controllers: [RbacController],
  providers: [RbacService, ProxmoxService, JwtService, AuthUtils],
  exports: [RbacService],
})
export class RbacModule {}
