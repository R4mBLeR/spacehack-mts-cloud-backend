import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Res,
  ClassSerializerInterceptor,
  UseInterceptors,
  Delete,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { User } from '../models/user.entity';
import { JwtGuard } from './guards/jwt.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUserId } from './decorators/current.user.decorator.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res,
  ): Promise<User> {
    const user = await this.authService.register(createUserDto);
    const tokensPair = await this.authService.generateNewTokens(
      user.id,
      user.username,
      user.roles,
    );

    res.setHeader('access_token', tokensPair.accessToken);
    res.setHeader('refresh_token', tokensPair.refreshToken);

    return user;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res,
  ): Promise<User> {
    const user = await this.authService.login(loginUserDto);
    const tokensPair = await this.authService.generateNewTokens(
      user.id,
      user.username,
      user.roles,
    );

    res.setHeader('access_token', tokensPair.accessToken);
    res.setHeader('refresh_token', tokensPair.refreshToken);

    return user;
  }

  @Post('refresh')
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: 'authorization', required: false })
  async refresh(@Headers('authorization') authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    const token = authorizationHeader.substring(7);
    return this.authService.refresh(token);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @Post('change_password')
  async changePassword(
    @CurrentUserId() userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    return this.authService.changePassword(changePasswordDto, userId);
  }

  @Delete('logout')
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: 'authorization', required: false })
  async logout(@Headers('authorization') authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    const token = authorizationHeader.substring(7);
    return this.authService.logout(token);
  }

  @Delete('logout_all')
  @ApiBearerAuth('access-token')
  @ApiHeader({ name: 'authorization', required: false })
  async logoutAll(@Headers('authorization') authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    if (!authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('INVALID_AUTHORIZATION_HEADER');
    }

    const token = authorizationHeader.substring(7);
    return this.authService.logout_all(token);
  }

  // @Post()
  // async complete(
  //   @Body() completeCreateUserDto: CompleteCreateUserDto,
  // ): Promise<User> {
  //   // return this.usersService.create(completeCreateUserDto);
  // }
}
