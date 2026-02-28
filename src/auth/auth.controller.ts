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
  Req,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
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
    res.cookie('refresh_token', tokensPair.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

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
    res.cookie('refresh_token', tokensPair.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return user;
  }

  @Post('refresh')
  @ApiCookieAuth('refresh_token')
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const token = req.cookies?.['refresh_token'];
    
    if (!token) {
      throw new UnauthorizedException('MISSING_REFRESH_TOKEN');
    }

    const tokensPair = await this.authService.refresh(token);
    res.setHeader('access_token', tokensPair.accessToken);
    res.cookie('refresh_token', tokensPair.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { success: true };
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
  @ApiCookieAuth('refresh_token')
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const token = req.cookies?.['refresh_token'];
    
    if (!token) {
      throw new UnauthorizedException('MISSING_REFRESH_TOKEN');
    }

    await this.authService.logout(token);
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @Delete('logout_all')
  @ApiCookieAuth('refresh_token')
  async logoutAll(@Req() req, @Res({ passthrough: true }) res) {
    const token = req.cookies?.['refresh_token'];
    
    if (!token) {
      throw new UnauthorizedException('MISSING_REFRESH_TOKEN');
    }

    await this.authService.logout_all(token);
    res.clearCookie('refresh_token');
    return { success: true };
  }

  // @Post()
  // async complete(
  //   @Body() completeCreateUserDto: CompleteCreateUserDto,
  // ): Promise<User> {
  //   // return this.usersService.create(completeCreateUserDto);
  // }
}
