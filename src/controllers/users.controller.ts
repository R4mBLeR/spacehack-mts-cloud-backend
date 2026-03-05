import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Headers,
  ClassSerializerInterceptor,
  UseGuards,
  Put,
  ForbiddenException,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../services/users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AssignRolesDto } from '../dto/assign-roles.dto';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { AuthUtils } from '../utils/auth.utils';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Создать пользователя (admin)' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  @ApiResponse({ status: 400, description: 'Валидация не пройдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован / нет роли admin' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Список всех пользователей (admin)' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Внутренний ID пользователя', example: 1 })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Patch('update_info')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  async updateUser(
    @CurrentUserId() userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Patch(':id/roles')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({
    summary: 'Назначить роли пользователю (admin)',
    description:
      'Заменяет роли пользователя и инвалидирует все его сессии. ' +
      'Пользователю потребуется повторно войти — при следующем login/refresh ' +
      'он получит access_token с актуальными ролями.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя', example: 1 })
  @ApiResponse({ status: 200, description: 'Роли обновлены, сессии инвалидированы' })
  @ApiResponse({ status: 404, description: 'Пользователь или роль не найдены' })
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolesDto,
  ): Promise<User> {
    return this.usersService.assignRoles(id, dto.roles);
  }
}
