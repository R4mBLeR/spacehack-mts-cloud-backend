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
  @Post()
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

  @Patch('update_plan')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  async updateVm(
    @CurrentUserId() userId: number,
    @Body() updateVmDto: UpdateVmDto,
  ): Promise<VirtualMachine> {
    return await this.vpsService.update(userId, updateVmDto);
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

  @Post('stop')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  async stopVm(
    @CurrentUserId() userId: number,
    @Body() stopVmDto: ChangeVmStatusDto,
  ): Promise<boolean> {
    return this.vpsService.stop(userId, stopVmDto);
  }
}
