import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { RbacService } from '../services/rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePveUserDto,
  UpdatePveUserDto,
  UpdateAclDto,
} from '../dto/rbac';

@ApiTags('RBAC')
@Controller('rbac')
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@HasRoles(Roles.ADMIN)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ─── Roles ─────────────────────────────────────────────────

  @Get('roles')
  @ApiOperation({ summary: 'Список всех ролей Proxmox' })
  listRoles() {
    return this.rbacService.listRoles();
  }

  @Get('roles/:roleid')
  @ApiOperation({ summary: 'Получить роль по ID' })
  @ApiParam({ name: 'roleid', type: String, description: 'Идентификатор роли Proxmox', example: 'PVEVMAdmin' })
  getRole(@Param('roleid') roleid: string) {
    return this.rbacService.getRole(roleid);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Создать новую роль в Proxmox' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto.roleid, dto.privs);
  }

  @Put('roles/:roleid')
  @ApiOperation({ summary: 'Обновить привилегии роли' })
  @ApiParam({ name: 'roleid', type: String, description: 'Идентификатор роли Proxmox', example: 'PVEVMAdmin' })
  updateRole(@Param('roleid') roleid: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(roleid, dto.privs, dto.append);
  }

  @Delete('roles/:roleid')
  @ApiOperation({ summary: 'Удалить роль' })
  @ApiParam({ name: 'roleid', type: String, description: 'Идентификатор роли Proxmox', example: 'PVEVMAdmin' })
  deleteRole(@Param('roleid') roleid: string) {
    return this.rbacService.deleteRole(roleid);
  }

  // ─── PVE Users ─────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Список пользователей Proxmox' })
  @ApiQuery({ name: 'enabled', required: false, type: Boolean })
  listPveUsers(@Query('enabled') enabled?: string) {
    const flag = enabled === undefined ? undefined : enabled === 'true';
    return this.rbacService.listPveUsers(flag);
  }

  @Get('users/:userid')
  @ApiOperation({ summary: 'Получить PVE-пользователя по userid' })
  @ApiParam({ name: 'userid', type: String, description: 'Идентификатор PVE-пользователя', example: 'admin@pve' })
  getPveUser(@Param('userid') userid: string) {
    return this.rbacService.getPveUser(userid);
  }

  @Post('users')
  @ApiOperation({ summary: 'Создать PVE-пользователя' })
  createPveUser(@Body() dto: CreatePveUserDto) {
    return this.rbacService.createPveUser(dto);
  }

  @Put('users/:userid')
  @ApiOperation({ summary: 'Обновить PVE-пользователя' })
  @ApiParam({ name: 'userid', type: String, description: 'Идентификатор PVE-пользователя', example: 'admin@pve' })
  updatePveUser(@Param('userid') userid: string, @Body() dto: UpdatePveUserDto) {
    return this.rbacService.updatePveUser(userid, dto);
  }

  @Delete('users/:userid')
  @ApiOperation({ summary: 'Удалить PVE-пользователя' })
  @ApiParam({ name: 'userid', type: String, description: 'Идентификатор PVE-пользователя', example: 'admin@pve' })
  deletePveUser(@Param('userid') userid: string) {
    return this.rbacService.deletePveUser(userid);
  }

  // ─── ACL ───────────────────────────────────────────────────

  @Get('acl')
  @ApiOperation({ summary: 'Список ACL-записей Proxmox' })
  listAcl() {
    return this.rbacService.listAcl();
  }

  @Put('acl')
  @ApiOperation({ summary: 'Назначить / удалить ACL (роль → пользователь → путь)' })
  updateAcl(@Body() dto: UpdateAclDto) {
    return this.rbacService.updateAcl(dto);
  }
}
