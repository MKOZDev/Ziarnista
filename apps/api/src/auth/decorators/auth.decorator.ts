import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role, SessionScope } from '../../generated/prisma/enums';
import { RolesGuard } from '../guards/roles.guard';
import { SessionGuard } from '../guards/session.guard';
import { Roles } from './roles.decorator';
import { UseSessionScope } from './session-scope.decorator';

// Names of the security schemes registered with addCookieAuth() in main.ts
export const STOREFRONT_SESSION_AUTH = 'storefront-session';
export const ADMIN_SESSION_AUTH = 'admin-session';

/** Storefront route that requires a logged-in user (any role). */
export function Auth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseSessionScope(SessionScope.STOREFRONT),
    UseGuards(SessionGuard),
    ApiCookieAuth(STOREFRONT_SESSION_AUTH),
    ApiUnauthorizedResponse({ description: 'Brak sesji lub sesja wygasła' }),
  );
}

/** Admin panel route: admin session cookie and the ADMIN role. */
export function AdminAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseSessionScope(SessionScope.ADMIN),
    UseGuards(SessionGuard, RolesGuard),
    Roles(Role.ADMIN),
    ApiCookieAuth(ADMIN_SESSION_AUTH),
    ApiUnauthorizedResponse({ description: 'Brak sesji panelu lub sesja wygasła' }),
    ApiForbiddenResponse({ description: 'Konto nie ma roli ADMIN' }),
  );
}
