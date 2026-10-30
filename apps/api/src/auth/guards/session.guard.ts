import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { SessionScope } from '../../generated/prisma/enums';
import type { AuthenticatedRequest } from '../authenticated-request';
import { SESSION_SCOPE_KEY } from '../decorators/session-scope.decorator';
import { SessionCookies } from '../session-cookies';
import { SessionsService } from '../sessions.service';

/** 401 unless the request carries a valid session cookie of the route's scope. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
    private readonly cookies: SessionCookies,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope =
      this.reflector.getAllAndOverride<SessionScope | undefined>(SESSION_SCOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? SessionScope.STOREFRONT;
    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const token = this.cookies.read(req, scope);
    if (!token) {
      throw new UnauthorizedException('Musisz się zalogować');
    }
    const session = await this.sessions.validate(token, scope);
    if (!session) {
      // Stale cookie: tell the browser to drop it (headers survive the exception response)
      this.cookies.clear(res, scope);
      throw new UnauthorizedException('Sesja wygasła, zaloguj się ponownie');
    }
    if (session.renewed) {
      this.cookies.set(res, scope, token, session.expiresAt);
    }
    req.user = session.user;
    return true;
  }
}
