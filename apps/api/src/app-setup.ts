import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export const API_PREFIX = 'api/v1';

/** App-wide settings shared by main.ts and HTTP tests, so tests hit the same URLs. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  // Fills req.cookies (session cookies); unsigned, the token itself is the secret
  app.use(cookieParser());
  app.enableShutdownHooks();
}
