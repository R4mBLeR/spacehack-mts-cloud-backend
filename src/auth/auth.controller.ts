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
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../models/user.entity';
import { JwtGuard } from './guards/jwt.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUserId } from './decorators/current.user.decorator.dto';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя', description: 'Создаёт пользователя и возвращает access_token в заголовке + refresh_token в HttpOnly cookie' })
  @ApiResponse({ status: 201, description: 'Пользователь создан, access_token в заголовке, refresh_token в cookie' })
  @ApiResponse({ status: 400, description: 'Валидация не пройдена (email, username, пароль)' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким username/email уже существует' })
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
  @ApiOperation({ summary: 'Авторизация', description: 'Возвращает access_token в заголовке + refresh_token в HttpOnly cookie' })
  @ApiResponse({ status: 201, description: 'Успешная авторизация' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
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
  @ApiOperation({ summary: 'Обновить токены', description: 'Ротация refresh_token (из HttpOnly cookie) → новая пара access + refresh' })
  @ApiResponse({ status: 201, description: 'Новая пара токенов выдана' })
  @ApiResponse({ status: 401, description: 'Refresh-токен отсутствует, истёк или отозван' })
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
  @ApiOperation({ summary: 'Сменить пароль', description: 'Требует текущий пароль для подтверждения' })
  @ApiResponse({ status: 201, description: 'Пароль изменён' })
  @ApiResponse({ status: 401, description: 'Не авторизован или старый пароль неверен' })
  async changePassword(
    @CurrentUserId() userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    return this.authService.changePassword(changePasswordDto, userId);
  }

  @Delete('logout')
  @ApiCookieAuth('refresh_token')
  @ApiOperation({ summary: 'Выйти (текущая сессия)', description: 'Инвалидирует refresh_token текущей сессии' })
  @ApiResponse({ status: 200, description: 'Сессия завершена, cookie удалена' })
  @ApiResponse({ status: 401, description: 'Refresh-токен отсутствует' })
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
  @ApiOperation({ summary: 'Выйти со всех устройств', description: 'Инвалидирует все refresh-токены пользователя' })
  @ApiResponse({ status: 200, description: 'Все сессии завершены' })
  @ApiResponse({ status: 401, description: 'Refresh-токен отсутствует' })
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
