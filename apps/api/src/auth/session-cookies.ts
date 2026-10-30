import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env.schema';
import type { SessionScope } from '../generated/prisma/enums';
import { SESSION_POLICIES } from './session-policy';

@Injectable()
export class SessionCookies {
  private readonly options: CookieOptions;

  constructor(@Inject(ENV) env: Env) {
    this.options = {
      httpOnly: true,
      sameSite: 'lax',
      // Browsers drop Secure cookies on plain http, which is what local development uses
      secure: env.NODE_ENV === 'production',
      path: '/',
    };
  }

  read(req: Request, scope: SessionScope): string | null {
    // req.cookies is filled by cookie-parser (configureApp) and typed as any
    const value: unknown = req.cookies?.[SESSION_POLICIES[scope].cookieName];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  set(res: Response, scope: SessionScope, token: string, expiresAt: Date): void {
    res.cookie(SESSION_POLICIES[scope].cookieName, token, { ...this.options, expires: expiresAt });
  }

  /** The attributes must match the ones used in set(), or the browser keeps the cookie. */
  clear(res: Response, scope: SessionScope): void {
    res.clearCookie(SESSION_POLICIES[scope].cookieName, this.options);
  }
}
