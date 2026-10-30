import type { ThrottlerOptions } from '@nestjs/throttler';
import type { Request } from 'express';

const WINDOW_MS = 15 * 60 * 1000;

// req.ip honors "trust proxy" (main.ts): behind the Next.js BFF it is the browser's address
function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

// Guards run before pipes, so the body is still raw here; normalize like loginSchema does
function bodyEmail(req: Request): string {
  const body: unknown = req.body;
  if (typeof body === 'object' && body !== null && 'email' in body) {
    return typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  }
  return '';
}

/**
 * Limits for login and registration (in-memory store, enough for a single API instance;
 * swap the storage for Redis when the API is scaled out). Every request counts, not only
 * failures, which keeps the logic simple and the limits are far above normal use.
 */
export const LOGIN_THROTTLERS: ThrottlerOptions[] = [
  // Password guessing against one account
  {
    name: 'ip-email',
    ttl: WINDOW_MS,
    limit: 5,
    getTracker: (req) => `${clientIp(req as Request)}|${bodyEmail(req as Request)}`,
  },
  // Credential stuffing (many accounts from one address) and email enumeration via register
  {
    name: 'ip',
    ttl: WINDOW_MS,
    limit: 30,
    getTracker: (req) => clientIp(req as Request),
  },
];

export const THROTTLE_ERROR_MESSAGE = 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.';
