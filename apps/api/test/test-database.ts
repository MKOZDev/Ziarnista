import { existsSync } from 'node:fs';
import { join } from 'node:path';

const rootEnvFile = join(__dirname, '../../../.env');

/**
 * Integration tests run against a separate database in the same PostgreSQL container:
 * TEST_DATABASE_URL, or DATABASE_URL with "_test" appended to the database name.
 * Tests truncate tables, so anything not ending in "_test" is refused.
 */
export function testDatabaseUrl(): string {
  if (existsSync(rootEnvFile)) {
    process.loadEnvFile(rootEnvFile);
  }
  const explicit = process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!explicit && !base) {
    throw new Error('Set TEST_DATABASE_URL (or DATABASE_URL) in the root .env');
  }

  const url = new URL(explicit ?? base ?? '');
  if (!explicit) {
    url.pathname = `${url.pathname}_test`;
  }
  if (!testDatabaseName(url).endsWith('_test')) {
    throw new Error(
      `Refusing to run tests on "${testDatabaseName(url)}": name must end with _test`,
    );
  }
  return url.toString();
}

export function testDatabaseName(url: URL): string {
  return decodeURIComponent(url.pathname.slice(1));
}
