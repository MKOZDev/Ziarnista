import type { INestApplication } from '@nestjs/common';

export const API_PREFIX = 'api/v1';

/** App-wide settings shared by main.ts and HTTP tests, so tests hit the same URLs. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
}
