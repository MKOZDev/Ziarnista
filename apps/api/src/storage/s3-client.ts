import {
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import type { StoredObject } from './storage.service';

// Shared by the Nest service and the scripts (storage:init, storage:orphans, test setup)

export type S3Config = {
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
};

export function createS3Client(config: S3Config): S3Client {
  return new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
    // <endpoint>/<bucket>/<key>: what MinIO needs, and R2 accepts it too
    forcePathStyle: true,
  });
}

/** Default public base URL: the bucket on the endpoint (MinIO, path style) */
export function defaultPublicUrl(endpoint: string, bucket: string): string {
  return `${endpoint.replace(/\/+$/, '')}/${bucket}`;
}

/**
 * Creates the bucket if missing and lets anyone read its objects (GetObject only: no
 * listing, no writes). Safe to run any number of times. Local MinIO and tests only;
 * the production R2 bucket is set up in the Cloudflare dashboard.
 */
export async function ensurePublicBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (!(error instanceof S3ServiceException) || error.$metadata.httpStatusCode !== 404) {
      throw error;
    }
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };
  await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
}

/** Every object under prefix, following pagination (1000 keys per page) */
export async function listAllObjects(
  client: S3Client,
  bucket: string,
  prefix: string,
): Promise<StoredObject[]> {
  const objects: StoredObject[] = [];
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key && object.LastModified) {
        objects.push({ key: object.Key, lastModified: object.LastModified });
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects;
}
