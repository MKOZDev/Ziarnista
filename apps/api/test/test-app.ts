import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configureApp } from '../src/app-setup';
import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/auth/password';
import { envSchema } from '../src/config/env.schema';
import type { Role } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { testDatabaseUrl } from './test-database';

/** Allowed by the default ALLOWED_ORIGINS; send it on every mutating request. */
export const STOREFRONT_ORIGIN = 'http://localhost:3000';
export const ADMIN_ORIGIN = 'http://localhost:3001';

export interface TestApp {
  app: INestApplication;
  server: Server;
  prisma: PrismaService;
}

/**
 * The full AppModule on the test database. A fresh app per test also means a fresh
 * in-memory rate limit store, so tests do not throttle each other.
 */
export async function createTestApp(): Promise<TestApp> {
  const env = envSchema.parse({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    ALLOWED_ORIGINS: `${STOREFRONT_ORIGIN},${ADMIN_ORIGIN}`,
  });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(env)],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, server: app.getHttpServer() as Server, prisma: app.get(PrismaService) };
}

/** CASCADE also empties tables referencing users (sessions, carts, orders, ...). */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users CASCADE');
}

export async function createUser(
  prisma: PrismaService,
  user: { email: string; password: string; role: Role; name?: string },
): Promise<{ id: string }> {
  return prisma.user.create({
    data: {
      email: user.email,
      name: user.name ?? 'Test',
      role: user.role,
      passwordHash: await hashPassword(user.password),
    },
    select: { id: true },
  });
}

/** Value of a cookie from the Set-Cookie headers of a response, with its attributes. */
export function findSetCookie(
  headers: Record<string, unknown>,
  name: string,
): { value: string; raw: string } | null {
  const setCookie = headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie.filter((c) => typeof c === 'string') : [];
  const raw = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!raw) {
    return null;
  }
  return { value: decodeURIComponent(raw.slice(name.length + 1).split(';')[0] ?? ''), raw };
}
