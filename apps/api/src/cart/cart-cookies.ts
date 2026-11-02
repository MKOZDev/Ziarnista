import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { generateSessionToken, hashSessionToken } from '../auth/session-token';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env.schema';

export const CART_COOKIE = 'zia_cart';
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The guest cart cookie. Same idea as the session cookie: a random 256-bit token in the
 * browser, only its SHA-256 in carts.guest_token. Renewed on every cart change, so an
 * active cart lives on; the daily cleanup removes carts untouched for 30 days.
 */
@Injectable()
export class CartCookies {
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

  read(req: Request): string | null {
    // req.cookies is filled by cookie-parser (configureApp) and typed as any
    const value: unknown = req.cookies?.[CART_COOKIE];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  set(res: Response, token: string): void {
    res.cookie(CART_COOKIE, token, {
      ...this.options,
      expires: new Date(Date.now() + CART_TTL_MS),
    });
  }

  /** The attributes must match the ones used in set(), or the browser keeps the cookie. */
  clear(res: Response): void {
    res.clearCookie(CART_COOKIE, this.options);
  }

  newToken(): string {
    return generateSessionToken();
  }

  /** Value stored in carts.guest_token */
  hash(token: string): string {
    return hashSessionToken(token);
  }
}
