import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../generated/prisma/enums';
import type { AuthenticatedRequest } from '../authenticated-request';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** 403 when the user's role is not listed in @Roles(). Must run after SessionGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) {
      throw new UnauthorizedException('Musisz się zalogować');
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Brak uprawnień');
    }
    return true;
  }
}
