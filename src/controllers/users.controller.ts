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
} from '@nestjs/common';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersService } from '../services/users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CurrentUserId } from '../auth/decorators/current.user.id.dto';
import { AuthUtils } from '../utils/auth.utils';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Put()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  async updateUser(
    @CurrentUserId() userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(userId, updateUserDto);
  }
}
