import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Res,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from '../services/auth.service';
import { TokensPair } from './dto/tokens-pair.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { User } from '../models/user.entity';

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

  // @Post()
  // async complete(
  //   @Body() completeCreateUserDto: CompleteCreateUserDto,
  // ): Promise<User> {
  //   // return this.usersService.create(completeCreateUserDto);
  // }
}
