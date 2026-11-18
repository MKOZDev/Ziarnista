import { NextResponse, type NextRequest } from 'next/server';
import { loginPath } from '@/lib/return-to';
import { SESSION_COOKIE } from '@/lib/session-cookie';

/**
 * Fast path only: sends visitors without a cookie to the login page before anything renders.
 * It cannot tell whether the cookie is still valid; GET /admin/me in SessionGate does that.
 * For the same reason /login never redirects away from here: a stale cookie would cause a loop.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(new URL(loginPath(`${pathname}${search}`), request.url));
}

export const config = {
  // /api/* is skipped: the API answers 401 as JSON, a redirect would turn it into a login page
  matcher: ['/((?!api/|_next/|login$|favicon\\.ico$).*)'],
};
