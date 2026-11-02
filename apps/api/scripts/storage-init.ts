// pnpm storage:init (run by `pnpm db:up`): creates the local MinIO bucket for product images
// and lets anyone read its files. Idempotent: running it again changes nothing.
// Not for production: the R2 bucket and its public domain are set up in Cloudflare.
import { createS3Client, defaultPublicUrl, ensurePublicBucket } from '../src/storage/s3-client';
import { loadScriptEnv } from './script-env';

async function main(): Promise<void> {
  const env = loadScriptEnv();
  const client = createS3Client(env);
  try {
    await ensurePublicBucket(client, env.S3_BUCKET);
  } finally {
    client.destroy();
  }
  const publicUrl = env.S3_PUBLIC_URL ?? defaultPublicUrl(env.S3_ENDPOINT, env.S3_BUCKET);
  console.log(`Bucket "${env.S3_BUCKET}" ready, public read: ${publicUrl}/<key>`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
