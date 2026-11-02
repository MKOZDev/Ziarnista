export type StoredObject = { key: string; lastModified: Date };

export type PutOptions = { contentType: string; cacheControl?: string };

/**
 * File storage used by the API. An abstract class rather than an interface: it doubles as
 * the dependency injection token, and tests can swap the implementation
 * (overrideProvider(StorageService)). The only implementation talks S3 (MinIO, R2).
 */
export abstract class StorageService {
  abstract put(key: string, body: Buffer, options: PutOptions): Promise<void>;

  /** Idempotent: deleting a missing key is not an error */
  abstract delete(key: string): Promise<void>;

  /** All objects whose key starts with prefix */
  abstract list(prefix: string): Promise<StoredObject[]>;

  /** URL a browser loads the object from (public bucket, no signing) */
  abstract publicUrl(key: string): string;
}
