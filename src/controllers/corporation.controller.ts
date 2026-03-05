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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
// Note: global prefix /api is set in main.ts, so controller prefix must NOT include it
import { CorporationService } from '../services/corporation.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { CreateCorporationDto } from '../dto/create.corporation.dto';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';

@ApiTags('Corporations')
@Controller('corporations')
export class CorporationController {
  constructor(private readonly corporationService: CorporationService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Создать корпорацию' })
  @ApiResponse({ status: 201, description: 'Корпорация создана' })
  @ApiResponse({ status: 400, description: 'Валидация не пройдена' })
  create(@Body() dto: CreateCorporationDto, @CurrentUserId() userId) {
    return this.corporationService.create(userId, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Список всех корпораций' })
  findAll() {
    return this.corporationService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Получить корпорацию по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID корпорации', example: 1 })
  findOne(@Param('id') id: number) {
    return this.corporationService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить корпорацию' })
  @ApiParam({ name: 'id', type: Number, description: 'ID корпорации', example: 1 })
  @ApiResponse({ status: 200, description: 'Корпорация удалена' })
  @ApiResponse({ status: 404, description: 'Корпорация не найдена' })
  remove(@Param('id') id: number, @CurrentUserId() userId) {
    return this.corporationService.remove(id, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Добавить участника в корпорацию' })
  @ApiParam({ name: 'id', type: Number, description: 'ID корпорации', example: 1 })
  @ApiParam({ name: 'userId', type: Number, description: 'ID пользователя для добавления', example: 2 })
  addMember(@Param('id') id: number, @CurrentUserId() userId) {
    return this.corporationService.addMember(id, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.CORPORATION_ADMIN)
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Удалить участника из корпорации' })
  @ApiParam({ name: 'id', type: Number, description: 'ID корпорации', example: 1 })
  @ApiParam({ name: 'userId', type: Number, description: 'ID удаляемого пользователя', example: 2 })
  removeMember(
    @Param('id') id: number,
    @CurrentUserId() adminId,
    userId: number,
  ) {
    return this.corporationService.removeMember(id, adminId, userId);
  }
}
