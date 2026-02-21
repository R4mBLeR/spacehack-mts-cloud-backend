import { Controller, Post, Body } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from '../services/auth.service';
import { TokensPair } from './dto/tokens-pair.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../models/user.entity';

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

  // @Post()
  // async complete(
  //   @Body() completeCreateUserDto: CompleteCreateUserDto,
  // ): Promise<User> {
  //   // return this.usersService.create(completeCreateUserDto);
  // }
}
