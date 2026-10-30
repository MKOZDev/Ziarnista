import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Next.js only reads .env files from the app directory; the repo keeps a single .env in the root.
// `next dev` / `next build` always run with the app directory as cwd.
const rootEnvFile = join(process.cwd(), '../../.env');

export type ServerEnv = {
  /** NestJS API origin, e.g. http://localhost:4000. Server-only: never prefix with NEXT_PUBLIC_. */
  API_URL: string;
};

/**
 * Loads the root .env (if present) and validates the variables used by next.config.ts.
 * Variables already set in the environment take precedence over the file.
 */
export function loadServerEnv(): ServerEnv {
  if (existsSync(rootEnvFile)) {
    process.loadEnvFile(rootEnvFile);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl || !URL.canParse(apiUrl)) {
    throw new Error(`Invalid environment variables:\n✖ API_URL must be a URL, got: ${apiUrl}`);
  }
  // Strip the trailing slash so rewrites don't produce "//api"
  return { API_URL: apiUrl.replace(/\/+$/, '') };
}
