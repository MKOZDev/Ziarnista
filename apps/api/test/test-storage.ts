import { DeleteObjectsCommand, type S3Client } from '@aws-sdk/client-s3';
import { envSchema } from '../src/config/env.schema';
import { defaultPublicUrl, listAllObjects } from '../src/storage/s3-client';
import { testDatabaseUrl } from './test-database';

/**
 * Integration tests use a separate bucket in the same MinIO: TEST_S3_BUCKET, or S3_BUCKET
 * with "-test" appended. Tests delete objects, so a name not ending in "-test" is refused.
 */
export function testStorageEnv() {
  // Loads the root .env as a side effect and gives the database the tests use
  const databaseUrl = testDatabaseUrl();
  const env = envSchema.parse({ ...process.env, DATABASE_URL: databaseUrl });
  const bucket = process.env.TEST_S3_BUCKET ?? `${env.S3_BUCKET}-test`;
  if (!bucket.endsWith('-test')) {
    throw new Error(`Refusing to run tests on bucket "${bucket}": name must end with -test`);
  }
  return { ...env, S3_BUCKET: bucket, S3_PUBLIC_URL: defaultPublicUrl(env.S3_ENDPOINT, bucket) };
}

/** URL the API returns for a storage key in tests */
export function testImageUrl(key: string): string {
  return `${testStorageEnv().S3_PUBLIC_URL}/${key}`;
}

export async function emptyBucket(client: S3Client, bucket: string): Promise<void> {
  const objects = await listAllObjects(client, bucket, '');
  // DeleteObjects takes at most 1000 keys
  for (let start = 0; start < objects.length; start += 1000) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects.slice(start, start + 1000).map(({ key }) => ({ Key: key })) },
      }),
    );
  }
}
