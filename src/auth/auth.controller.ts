import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from '../services/auth.service';
import { TokensPair } from './dto/tokens-pair.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<TokensPair> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<TokensPair> {
    return this.authService.login(loginUserDto);
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
