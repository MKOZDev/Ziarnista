import {
  ForbiddenException,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env.schema';
import { SKIP_ORIGIN_CHECK_KEY } from './skip-origin-check.decorator';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF protection (global guard): a mutating request must carry an Origin header from
 * ALLOWED_ORIGINS. Browsers always send Origin on these methods and a page cannot forge it,
 * so a form on another site cannot use the visitor's session cookie. A missing header means
 * a non-browser client; it is rejected too, so the rule has no exceptions to reason about.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor(
    private readonly reflector: Reflector,
    @Inject(ENV) env: Env,
  ) {
    this.allowedOrigins = new Set(env.ALLOWED_ORIGINS);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!MUTATING_METHODS.has(req.method)) {
      return true;
    }
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_ORIGIN_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }
    const origin = req.headers.origin;
    if (!origin || !this.allowedOrigins.has(origin)) {
      throw new ForbiddenException('Niedozwolone źródło żądania');
    }
    return true;
  }
}
