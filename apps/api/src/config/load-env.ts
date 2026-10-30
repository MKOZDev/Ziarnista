import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { envSchema, type Env } from './env.schema';

// Same depth from src/config (dev, tests) and dist/config (build output)
const rootEnvFile = join(__dirname, '../../../../.env');

export class EnvValidationError extends Error {
  override name = 'EnvValidationError';
}

/**
 * Loads the root .env (if present) and validates process.env.
 * Variables already set in the environment take precedence over the file.
 */
export function loadEnv(): Env {
  if (existsSync(rootEnvFile)) {
    process.loadEnvFile(rootEnvFile);
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new EnvValidationError(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
