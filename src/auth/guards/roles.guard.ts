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
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private authUtils: AuthUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();

    if (!request) {
      throw new InternalServerErrorException();
    }
    const token = this.authUtils.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('TOKEN_IS_UNDEFINED');
    }
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    const userRoles = payload.roles || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    console.log(hasRequiredRole);

    if (!hasRequiredRole) {
      throw new UnauthorizedException('NO_REQUIRED_ROLE');
    }
    return true;
  }
}
