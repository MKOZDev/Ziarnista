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

type SessionCheck = 'valid' | 'missing' | 'expired';

/** 401 unless the request carries a valid session cookie of the route's scope. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
    private readonly cookies: SessionCookies,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = await this.authenticate(context);
    if (check === 'missing') {
      throw new UnauthorizedException('Musisz się zalogować');
    }
    if (check === 'expired') {
      throw new UnauthorizedException('Sesja wygasła, zaloguj się ponownie');
    }
    return true;
  }

  /** Sets req.user for a valid session; a stale cookie is cleared, never an error here. */
  protected async authenticate(context: ExecutionContext): Promise<SessionCheck> {
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
      return 'missing';
    }
    const session = await this.sessions.validate(token, scope);
    if (!session) {
      // Stale cookie: tell the browser to drop it (headers survive an exception response)
      this.cookies.clear(res, scope);
      return 'expired';
    }
    if (session.renewed) {
      this.cookies.set(res, scope, token, session.expiresAt);
    }
    req.user = session.user;
    return 'valid';
  }
}

/**
 * Routes open to guests that behave differently for a logged-in user (cart, checkout):
 * req.user is set when the session is valid, and the request goes on either way.
 */
@Injectable()
export class OptionalSessionGuard extends SessionGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authenticate(context);
    return true;
  }
}
