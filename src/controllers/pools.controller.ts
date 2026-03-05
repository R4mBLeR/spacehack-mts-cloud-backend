import {
  Controller, Get, Post, Put, Delete,
  Param, Body,
  UseGuards, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { PoolsService } from '../services/pools.service';
import { CreatePoolDto, UpdatePoolDto } from '../dto/pool/pool.dto';

@ApiTags('Pools')
@Controller('pools')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@HasRoles(Roles.ADMIN)
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  @ApiOperation({ summary: 'Список всех пулов' })
  listPools() {
    return this.poolsService.listPools();
  }

  @Get(':poolid')
  @ApiOperation({ summary: 'Детали пула (список VM и storage)' })
  @ApiParam({ name: 'poolid', type: String, description: 'Идентификатор пула', example: 'my-pool' })
  getPool(@Param('poolid') poolid: string) {
    return this.poolsService.getPool(poolid);
  }

  @Post()
  @ApiOperation({ summary: 'Создать пул' })
  createPool(@Body() dto: CreatePoolDto) {
    return this.poolsService.createPool(dto);
  }

  @Put(':poolid')
  @ApiOperation({ summary: 'Обновить пул (добавить/убрать VM или Storage)' })
  @ApiParam({ name: 'poolid', type: String, description: 'Идентификатор пула', example: 'my-pool' })
  updatePool(
    @Param('poolid') poolid: string,
    @Body() dto: UpdatePoolDto,
  ) {
    return this.poolsService.updatePool(poolid, dto);
  }

  @Delete(':poolid')
  @ApiOperation({ summary: 'Удалить пул' })
  @ApiParam({ name: 'poolid', type: String, description: 'Идентификатор пула', example: 'my-pool' })
  deletePool(@Param('poolid') poolid: string) {
    return this.poolsService.deletePool(poolid);
  }
}
