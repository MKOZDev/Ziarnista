import { DeleteObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env.schema';
import { createS3Client, defaultPublicUrl, listAllObjects } from './s3-client';
import { StorageService, type PutOptions, type StoredObject } from './storage.service';

@Injectable()
export class S3StorageService extends StorageService implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(@Inject(ENV) env: Env) {
    super();
    this.client = createS3Client(env);
    this.bucket = env.S3_BUCKET;
    this.publicBaseUrl = env.S3_PUBLIC_URL ?? defaultPublicUrl(env.S3_ENDPOINT, env.S3_BUCKET);
  }

  async put(key: string, body: Buffer, options: PutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    // S3 answers 204 for a missing key too
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  list(prefix: string): Promise<StoredObject[]> {
    return listAllObjects(this.client, this.bucket, prefix);
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
