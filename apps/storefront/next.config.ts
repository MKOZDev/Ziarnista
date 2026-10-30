import type { NextConfig } from 'next';
import { loadServerEnv } from './src/server-env';

const env = loadServerEnv();

const nextConfig: NextConfig = {
  // BFF: the browser only talks to this origin; /api/* is proxied to NestJS.
  // Note: rewrites are resolved at build time, so API_URL must be set during `next build`.
  rewrites() {
    return Promise.resolve([{ source: '/api/:path*', destination: `${env.API_URL}/api/:path*` }]);
  },
};

export default nextConfig;
