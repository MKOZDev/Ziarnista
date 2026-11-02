// pnpm storage:orphans [--delete]: files in the bucket that no product image row points to.
// Dry run by default (only lists them). --delete removes them. Files younger than 24 h are
// never touched: an upload stores the file before inserting its row.
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { findOrphans, ORPHAN_MIN_AGE_MS } from '../src/storage/orphans';
import { createS3Client, listAllObjects } from '../src/storage/s3-client';
import { loadScriptEnv } from './script-env';

const PREFIX = 'products/';

async function main(): Promise<void> {
  const shouldDelete = process.argv.includes('--delete');
  const env = loadScriptEnv();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  const s3 = createS3Client(env);

  try {
    // Objects first: a row inserted after this read still has an object in the list,
    // and a file uploaded after it is not listed at all, so neither is reported
    const objects = await listAllObjects(s3, env.S3_BUCKET, PREFIX);
    const rows = await prisma.productImage.findMany({ select: { storageKey: true } });
    const orphans = findOrphans(objects, new Set(rows.map((row) => row.storageKey)), new Date());

    const hours = ORPHAN_MIN_AGE_MS / 3_600_000;
    console.log(
      `Bucket "${env.S3_BUCKET}": ${objects.length} files, ${rows.length} image rows, ` +
        `${orphans.length} orphaned (older than ${hours} h).`,
    );
    for (const orphan of orphans) {
      console.log(`  ${orphan.lastModified.toISOString()}  ${orphan.key}`);
    }
    if (orphans.length === 0) {
      return;
    }
    if (!shouldDelete) {
      console.log('Dry run, nothing deleted. Run with --delete to remove them.');
      return;
    }
    // DeleteObjects takes at most 1000 keys
    for (let start = 0; start < orphans.length; start += 1000) {
      const batch = orphans.slice(start, start + 1000);
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET,
          Delete: { Objects: batch.map(({ key }) => ({ Key: key })) },
        }),
      );
    }
    console.log(`Deleted ${orphans.length} files.`);
  } finally {
    s3.destroy();
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
