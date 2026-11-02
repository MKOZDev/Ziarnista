import type { StoredObject } from './storage.service';

/** Uploads put the object first and insert its row after; a fresh object may be mid-upload */
export const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Objects in the bucket that no database row points to, older than minAgeMs. Such files
 * are left by a failed compensation after a failed insert, or a failed storage delete
 * after the row was deleted (the code never leaves a row without its file).
 */
export function findOrphans(
  objects: readonly StoredObject[],
  knownKeys: ReadonlySet<string>,
  now: Date,
  minAgeMs = ORPHAN_MIN_AGE_MS,
): StoredObject[] {
  return objects.filter(
    (object) =>
      !knownKeys.has(object.key) && now.getTime() - object.lastModified.getTime() >= minAgeMs,
  );
}
