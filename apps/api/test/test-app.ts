import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configureApp } from '../src/app-setup';
import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/auth/password';
import { SESSION_POLICIES } from '../src/auth/session-policy';
import { generateSessionToken, hashSessionToken } from '../src/auth/session-token';
import { envSchema } from '../src/config/env.schema';
import type { Role } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { testDatabaseUrl } from './test-database';
import { testStorageEnv } from './test-storage';

/** Allowed by the default ALLOWED_ORIGINS; send it on every mutating request. */
export const STOREFRONT_ORIGIN = 'http://localhost:3000';
export const ADMIN_ORIGIN = 'http://localhost:3001';

export interface TestApp {
  app: INestApplication;
  server: Server;
  prisma: PrismaService;
  storage: StorageService;
}

export interface TestAppOptions {
  /** Replaces the S3 storage, e.g. with one that fails, to test the failure paths */
  storage?: StorageService;
}

/**
 * The full AppModule on the test database and test bucket. A fresh app per test also means
 * a fresh in-memory rate limit store, so tests do not throttle each other.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const env = envSchema.parse({
    ...testStorageEnv(),
    NODE_ENV: 'test',
    DATABASE_URL: testDatabaseUrl(),
    ALLOWED_ORIGINS: `${STOREFRONT_ORIGIN},${ADMIN_ORIGIN}`,
  });
  const builder = Test.createTestingModule({ imports: [AppModule.forRoot(env)] });
  if (options.storage) {
    builder.overrideProvider(StorageService).useValue(options.storage);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return {
    app,
    server: app.getHttpServer() as Server,
    prisma: app.get(PrismaService),
    storage: app.get(StorageService),
  };
}

/**
 * CASCADE also empties the tables referencing these (sessions, user carts, orders, variants,
 * images, ...). Guest carts reference no user, so carts is listed explicitly.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE users, carts, products, categories, origins CASCADE',
  );
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

/**
 * Cookie header of a panel session created directly in the database, for tests of admin
 * endpoints (skips the login endpoint and its rate limit). The user's role is not checked
 * here, so it also builds the "admin-scoped session of a customer" case.
 */
export async function adminSessionCookie(prisma: PrismaService, userId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      scope: 'ADMIN',
      expiresAt: new Date(Date.now() + SESSION_POLICIES.ADMIN.ttlMs),
    },
  });
  return `${SESSION_POLICIES.ADMIN.cookieName}=${token}`;
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
