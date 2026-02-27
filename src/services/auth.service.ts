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
import { Role } from '../models/role.entity';
import { User } from '../models/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private jwtService: JwtService,
    private authUtils: AuthUtils,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  async login(loginUserDto: LoginUserDto): Promise<User> {
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
    return user;
  }

  async refresh(token: string): Promise<TokensPair> {
    const session = await this.sessionRepository.findSessionByToken(token);
    if (session == null) {
      throw new UnauthorizedException('REFRESH_TOKEN_IS_EXPIRED');
    }
    return this.updateTokens(
      session.user.id,
      session.user.username,
      session.user.roles,
      session.refresh_token,
    );
  }

  public async generateNewTokens(
    userId: number,
    username: string,
    roles: Role[],
  ): Promise<TokensPair> {
    const userRoles = roles?.map((r) => r.role);
    const payload = { id: userId, username, roles: userRoles };

    const tokensPair = new TokensPair();
    tokensPair.accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const session = await this.sessionRepository.addSession(
      userId,
      this.authUtils.generateRefresh(),
    );
    if (!session) {
      throw new InternalServerErrorException('SESSION_CANT_CREATE_TOKEN');
    }
    tokensPair.refreshToken = session.refresh_token;
    return tokensPair;
  }

  private async updateTokens(
    userId: number,
    username: string,
    roles: Role[],
    oldToken: string,
  ): Promise<TokensPair> {
    const userRoles = roles?.map((r) => r.role);

    const payload = { sub: userId, username, roles: userRoles };

    const tokensPair = new TokensPair();
    tokensPair.accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    tokensPair.refreshToken = await this.sessionRepository.updateToken(
      oldToken,
      this.authUtils.generateRefresh(),
    );
    return tokensPair;
  }
}
