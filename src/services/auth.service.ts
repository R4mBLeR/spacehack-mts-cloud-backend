import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { TokensPair } from '../auth/dto/tokens-pair.dto';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { AuthUtils } from '../utils/auth.utils';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private jwtService: JwtService,
    private authUtils: AuthUtils,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<TokensPair> {
    const user = await this.usersService.create(createUserDto);
    return this.generateTokens(user.id, user.username);
  }

  async login(loginUserDto: LoginUserDto): Promise<TokensPair> {
    const user = await this.userRepository.findOneBy({
      username: loginUserDto.username,
    });

    if (!user) {
      throw new UnauthorizedException('USERNAME_OR_PASSWORD_IS_INCORRECT');
    }
    const isPasswordValid = await this.authUtils.comparePasswords(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('USERNAME_OR_PASSWORD_IS_INCORRECT');
    }
    const tokens = this.generateTokens(user.id, user.username);
    return tokens;
  }

  private async generateTokens(
    userId: number,
    username: string,
  ): Promise<TokensPair> {
    const payload = { sub: userId, username };

    const tokensPair = new TokensPair();
    tokensPair.accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const session = await this.sessionRepository.addToken(
      userId,
      this.authUtils.generateRefresh(),
    );
    if (!session) {
      throw new InternalServerErrorException('SESSION_CANT_CREATE_TOKEN');
    }
    tokensPair.refreshToken = session.refresh_token;
    return tokensPair;
  }
}
