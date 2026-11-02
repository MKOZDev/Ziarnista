import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { envSchema, type Env } from '../src/config/env.schema';

const rootEnvFile = join(__dirname, '../../../.env');

/** The API environment for command-line scripts: root .env (the environment wins), validated. */
export function loadScriptEnv(): Env {
  if (existsSync(rootEnvFile)) {
    process.loadEnvFile(rootEnvFile);
  }
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
