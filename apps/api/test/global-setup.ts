import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { testDatabaseName, testDatabaseUrl } from './test-database';

/** Runs once before the integration tests: creates the test database and applies migrations. */
export default async function setup(): Promise<void> {
  const url = new URL(testDatabaseUrl());
  const name = testDatabaseName(url);
  // CREATE DATABASE cannot take a bind parameter, so the identifier is validated instead
  if (!/^[a-z0-9_]+$/.test(name)) {
    throw new Error(`Unexpected test database name "${name}"`);
  }

  // The docker init scripts only run on an empty volume, so the database is created here.
  // Connect to the always-present "postgres" database to do it.
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: adminUrl.toString() }),
  });
  try {
    const rows = await admin.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${name}) AS "exists"`;
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  // migrate deploy (not dev): applies existing migrations only, never creates new ones
  execSync('pnpm exec prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });
}
