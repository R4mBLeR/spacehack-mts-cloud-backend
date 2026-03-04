import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { VpsService } from '../services/vps.service';
import { CreateVmDto } from '../dto/create-vm.dto';
import { VirtualMachine } from '../models/vm.entity';
import { UpdateVmDto } from '../dto/update-vm.dto';
import { ChangeVmStatusDto } from '../dto/change.vm.status.dto';

@Controller('vps')
@UseInterceptors(ClassSerializerInterceptor)
export class VpsController {
  constructor(private readonly vpsService: VpsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @Post('create')
  async create(
    @CurrentUserId() userId: number,
    @Body() createVmDto: CreateVmDto,
  ): Promise<VirtualMachine> {
    return this.vpsService.create(createVmDto, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @Get()
  async findAll(): Promise<VirtualMachine[]> {
    return this.vpsService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<VirtualMachine> {
    return this.vpsService.findOne(+id);
  }

  @Delete('delete')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  async deleteVm(
    @CurrentUserId() userId: number,
    @Body() deleteVmDto: ChangeVmStatusDto,
  ): Promise<boolean> {
    return this.vpsService.delete(userId, deleteVmDto);
  }

  @Post('start')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
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
  async shutdown(
    @CurrentUserId() userId: number,
    @Body() shutdownVmDto: ChangeVmStatusDto,
  ): Promise<void> {
    return this.vpsService.shutdownVm(userId, shutdownVmDto);
  }

  @Patch('update')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  async updateVm(@Body() dto: UpdateVmDto): Promise<VirtualMachine> {
    return this.vpsService.updateVm(dto);
  }
}
