import {
  Controller, Get, Param, Post,
  UseGuards, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ProxmoxService } from '../api/proxmox.service';

@ApiTags('SDN')
@Controller('sdn')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@HasRoles(Roles.ADMIN)
export class SdnController {
  constructor(private readonly proxmox: ProxmoxService) {}

  @Get('zones')
  @ApiOperation({ summary: 'Список SDN-зон (VXLAN, VLAN и т.д.)' })
  listZones() {
    return this.proxmox.getSdnZones();
  }

  @Get('zones/:zone')
  @ApiOperation({ summary: 'Детали SDN-зоны' })
  getZone(@Param('zone') zone: string) {
    return this.proxmox.getSdnZone(zone);
  }

  @Get('vnets')
  @ApiOperation({ summary: 'Список VNet (виртуальных сетей)' })
  listVnets() {
    return this.proxmox.getSdnVnets();
  }

  @Get('vnets/:vnet')
  @ApiOperation({ summary: 'Детали VNet' })
  getVnet(@Param('vnet') vnet: string) {
    return this.proxmox.getSdnVnet(vnet);
  }

  @Get('vnets/:vnet/subnets')
  @ApiOperation({ summary: 'Подсети VNet' })
  getSubnets(@Param('vnet') vnet: string) {
    return this.proxmox.getSdnSubnets(vnet);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Применить изменения SDN (аналог кнопки Apply в GUI)' })
  applySdn() {
    return this.proxmox.applySdn();
  }
}
