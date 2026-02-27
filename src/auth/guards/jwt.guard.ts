import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthUtils } from '../../utils/auth.utils';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private authUtils: AuthUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request) {
      throw new InternalServerErrorException();
    }
    const token = this.authUtils.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('TOKEN_IS_UNDEFINED');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      console.log(payload);
    } catch (e) {
      throw new UnauthorizedException('TOKEN_IS_INVALID');
    }
    return true;
  }
}
