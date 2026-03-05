import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PoolsController } from '../controllers/pools.controller';
import { PoolsService } from '../services/pools.service';
import { ProxmoxService } from '../api/proxmox.service';
import { AuthUtils } from '../utils/auth.utils';

@Module({
  controllers: [PoolsController],
  providers: [PoolsService, ProxmoxService, JwtService, AuthUtils],
  exports: [PoolsService],
})
export class PoolsModule {}
