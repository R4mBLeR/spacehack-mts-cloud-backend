import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
  UseGuards, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { LxcService } from '../services/lxc.service';
import { CreateLxcDto } from '../dto/lxc/create-lxc.dto';
import { UpdateLxcDto } from '../dto/lxc/update-lxc.dto';

@ApiTags('LXC')
@Controller('lxc')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@HasRoles(Roles.ADMIN)
export class LxcController {
  constructor(private readonly lxcService: LxcService) {}

  @Get()
  @ApiOperation({ summary: 'Список LXC-контейнеров на ноде (Proxmox)' })
  listAll() {
    return this.lxcService.listAll();
  }

  @Post('create')
  @ApiOperation({ summary: 'Создать LXC-контейнер' })
  create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateLxcDto,
  ) {
    return this.lxcService.create(dto, userId);
  }

  @Get(':proxmoxId')
  @ApiOperation({ summary: 'Статус LXC по proxmox_id' })
  getStatus(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.getStatus(+proxmoxId);
  }

  @Get(':proxmoxId/config')
  @ApiOperation({ summary: 'Конфигурация LXC' })
  getConfig(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.getConfig(+proxmoxId);
  }

  @Get(':proxmoxId/monitoring')
  @ApiOperation({ summary: 'RRD-метрики LXC' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['hour', 'day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'cf', required: false, enum: ['AVERAGE', 'MAX'] })
  getMonitoring(
    @Param('proxmoxId') proxmoxId: number,
    @Query('timeframe') timeframe?: string,
    @Query('cf') cf?: string,
  ) {
    return this.lxcService.getMonitoring(+proxmoxId, timeframe, cf);
  }

  @Patch(':proxmoxId/config')
  @ApiOperation({ summary: 'Обновить конфигурацию LXC' })
  updateConfig(
    @Param('proxmoxId') proxmoxId: number,
    @Body() dto: UpdateLxcDto,
  ) {
    return this.lxcService.updateConfig(+proxmoxId, dto);
  }

  @Post(':proxmoxId/start')
  @ApiOperation({ summary: 'Запустить LXC' })
  start(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.start(+proxmoxId);
  }

  @Post(':proxmoxId/stop')
  @ApiOperation({ summary: 'Остановить LXC (hard stop)' })
  stop(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.stop(+proxmoxId);
  }

  @Post(':proxmoxId/shutdown')
  @ApiOperation({ summary: 'Выключить LXC (graceful)' })
  shutdown(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.shutdown(+proxmoxId);
  }

  @Post(':proxmoxId/reboot')
  @ApiOperation({ summary: 'Перезагрузить LXC' })
  reboot(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.reboot(+proxmoxId);
  }

  @Delete(':proxmoxId')
  @ApiOperation({ summary: 'Удалить LXC-контейнер' })
  delete(@Param('proxmoxId') proxmoxId: number) {
    return this.lxcService.delete(+proxmoxId);
  }
}
