// controllers/corporation.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CorporationService } from '../services/corporation.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { CreateCorporationDto } from '../dto/create.corporation.dto';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';

@Controller('api/corporations')
export class CorporationController {
  constructor(private readonly corporationService: CorporationService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create corporation' })
  create(@Body() dto: CreateCorporationDto, @CurrentUserId() userId) {
    return this.corporationService.create(userId, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all corporations' })
  findAll() {
    return this.corporationService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get corporation by id' })
  findOne(@Param('id') id: number) {
    return this.corporationService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete corporation' })
  remove(@Param('id') id: number, @CurrentUserId() userId) {
    return this.corporationService.remove(id, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Add member to corporation' })
  addMember(
    @Param('id') corpId: number,
    @Param('userId') userId: number,
    @CurrentUserId() currentUserId: number,
  ) {
    return this.corporationService.addMember(corpId, userId, currentUserId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from corporation' })
  removeMember(
    @Param('id') corpId: number,
    @Param('userId') userId: number,
    @CurrentUserId() adminId: number,
  ) {
    return this.corporationService.removeMember(corpId, adminId, userId);
  }
}