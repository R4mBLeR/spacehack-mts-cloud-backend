import {
  Controller, Get, Param, Query,
  UseGuards, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { StorageService } from '../services/storage.service';

@ApiTags('Storage')
@Controller('storage')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@HasRoles(Roles.ADMIN)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @ApiOperation({ summary: 'Глобальный список storage (конфигурация кластера)' })
  listGlobal() {
    return this.storageService.listGlobal();
  }

  @Get('node')
  @ApiOperation({ summary: 'Список хранилищ на ноде pve' })
  listNodeStorages() {
    return this.storageService.listNodeStorages();
  }

  @Get(':storage/content')
  @ApiOperation({ summary: 'Содержимое хранилища (ISO, шаблоны, бэкапы)' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['iso', 'vztmpl', 'backup', 'images', 'rootdir'],
  })
  getContent(
    @Param('storage') storage: string,
    @Query('type') type?: string,
  ) {
    return this.storageService.getStorageContent(storage, type);
  }
}
