import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { VpsService } from '../services/vps.service';
import { CreateVmDto } from '../dto/create-vm.dto';
import { VirtualMachine } from '../models/vm.entity';
import { UpdateVmDto } from '../dto/update-vm.dto';
import { ChangeVmStatusDto } from '../dto/change.vm.status.dto';
import { CreateSnapshotDto } from '../dto/create-snapshot.dto';
import { SnapshotActionDto } from '../dto/snapshot-action.dto';

@ApiTags('VPS')
@Controller('vps')
@UseInterceptors(ClassSerializerInterceptor)
export class VpsController {
  constructor(private readonly vpsService: VpsService) {}

  // ─── Admin routes (BEFORE :id to avoid route conflicts) ───

  @Get('admin/proxmox-vms')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Все VM на ноде из Proxmox (для синхронизации)' })
  async getProxmoxVmList() {
    return this.vpsService.getProxmoxVmList();
  }

  @Get('admin/cluster-resources')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Все ресурсы кластера Proxmox' })
  @ApiQuery({ name: 'type', required: false, enum: ['vm', 'storage', 'node', 'sdn'] })
  async getClusterResources(@Query('type') type?: string) {
    return this.vpsService.getClusterResources(type);
  }

  // ─── CRUD ─────────────────────────────────────────────────

  @Post('create')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Создать VM (клон шаблона + cloud-init)' })
  @ApiResponse({ status: 201, description: 'VM создана и записана в БД' })
  @ApiResponse({ status: 400, description: 'Валидация не пройдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @CurrentUserId() userId: number,
    @Body() createVmDto: CreateVmDto,
  ): Promise<VirtualMachine> {
    return this.vpsService.create(createVmDto, userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Список всех VM (admin)' })
  async findAll(): Promise<VirtualMachine[]> {
    return this.vpsService.findAll();
  }

  @Patch('update')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Обновить конфигурацию VM (CPU, RAM, Disk)' })
  @ApiResponse({ status: 200, description: 'Конфигурация обновлена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async updateVm(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateVmDto,
  ): Promise<VirtualMachine> {
    return this.vpsService.updateVm(userId, dto);
  }

  @Delete('delete')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Удалить VM' })
  @ApiResponse({ status: 200, description: 'VM удалена из Proxmox и БД' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'VM не найдена или не принадлежит пользователю' })
  async deleteVm(
    @CurrentUserId() userId: number,
    @Body() deleteVmDto: ChangeVmStatusDto,
  ): Promise<boolean> {
    return this.vpsService.delete(userId, deleteVmDto);
  }

  // ─── Power management ─────────────────────────────────

  @Post('start')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Запустить VM' })
  async startVm(
    @CurrentUserId() userId: number,
    @Body() startVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    return this.vpsService.start(userId, startVmDto);
  }

  @Post('stop')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Остановить VM (hard stop)' })
  async stopVm(
    @CurrentUserId() userId: number,
    @Body() stopVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    return this.vpsService.stop(userId, stopVmDto);
  }

  @Post('restart')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Перезагрузить VM (reboot)' })
  async restartVm(
    @CurrentUserId() userId: number,
    @Body() restartVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    return this.vpsService.restart(userId, restartVmDto);
  }

  @Post('shutdown')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Выключить VM (graceful shutdown)' })
  async shutdown(
    @CurrentUserId() userId: number,
    @Body() shutdownVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    return this.vpsService.shutdownVm(userId, shutdownVmDto);
  }

  // ─── Snapshots (BEFORE :id routes) ───────────────────

  @Post('snapshots/create')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Создать снапшот VM' })
  async createSnapshot(
    @CurrentUserId() userId: number,
    @Body() dto: CreateSnapshotDto,
  ) {
    return this.vpsService.createSnapshot(dto, userId);
  }

  @Post('snapshots/rollback')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Откатить VM к снапшоту' })
  async rollbackSnapshot(
    @CurrentUserId() userId: number,
    @Body() dto: SnapshotActionDto,
  ) {
    return this.vpsService.rollbackSnapshot(dto, userId);
  }

  @Delete('snapshots/delete')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Удалить снапшот VM' })
  async deleteSnapshot(
    @CurrentUserId() userId: number,
    @Body() dto: SnapshotActionDto,
  ) {
    return this.vpsService.deleteSnapshot(dto, userId);
  }

  // ─── Parametric :id routes (LAST) ────────────────────

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Получить VM по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Внутренний ID в БД', example: 1 })
  async findOne(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
  ): Promise<VirtualMachine> {
    return this.vpsService.findOne(+id, userId);
  }

  @Get('')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Получить VM по User ID' })
  async findByUserId(
    @CurrentUserId() userId: number,
  ): Promise<VirtualMachine[]> {
    return this.vpsService.findByUserId(userId);
  }

  @Get(':id/monitoring')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'RRD-данные VM (CPU, RAM, NET, Disk)' })
  @ApiParam({ name: 'id', type: Number, description: 'Внутренний ID в БД', example: 1 })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['hour', 'day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'cf', required: false, enum: ['AVERAGE', 'MAX'] })
  async getVmMonitoring(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
    @Query('timeframe') timeframe?: string,
    @Query('cf') cf?: string,
  ) {
    return this.vpsService.getVmMonitoring(+id, userId, timeframe, cf);
  }

  @Get(':id/snapshots')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Список снапшотов VM' })
  @ApiParam({ name: 'id', type: Number, description: 'Внутренний ID в БД', example: 1 })
  async listSnapshots(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
  ) {
    return this.vpsService.listSnapshots(+id, userId);
  }
}
