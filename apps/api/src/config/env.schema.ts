import { z } from 'zod';

const DEV_ORIGINS = 'http://localhost:3000,http://localhost:3001,http://localhost:4000';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Comma-separated origins allowed to send mutating requests (CSRF check on the Origin header).
  // Normalized with URL.origin, so "http://localhost:3000/" matches the header "http://localhost:3000".
  ALLOWED_ORIGINS: z
    .string()
    .default(DEV_ORIGINS)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin)).min(1)),
  // Express "trust proxy": which proxies may set X-Forwarded-For (the Next.js BFF in front of the API).
  // Needed so req.ip is the browser's address, which the login rate limit is keyed on.
  // Next.js rewrites do not add X-Forwarded-For, they only pass on what they received. In
  // production a reverse proxy in front of Next.js must append the client IP (nginx:
  // $proxy_add_x_forwarded_for); Express takes the rightmost entry, so a value forged by the
  // client is ignored. Without that proxy the header is client-controlled.
  TRUST_PROXY: z.string().default('loopback'),
});

export type Env = z.infer<typeof envSchema>;
