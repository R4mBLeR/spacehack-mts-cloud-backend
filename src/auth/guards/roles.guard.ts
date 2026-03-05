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
import { Roles } from '../roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private authUtils: AuthUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    if (!request) {
      throw new InternalServerErrorException();
    }
    const token = this.authUtils.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('TOKEN_IS_UNDEFINED');
    }
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
    } catch (e) {
      throw new UnauthorizedException('TOKEN_IS_INVALID');
    }

    request.user = {
      id: payload.id,
      username: payload.username,
    };

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRoles: string[] = payload.roles || [];

    // admin проходит любую проверку ролей
    if (userRoles.includes(Roles.ADMIN)) {
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );
    if (!hasRequiredRole) {
      throw new UnauthorizedException('NO_REQUIRED_ROLE');
    }

    return true;
  }
}
