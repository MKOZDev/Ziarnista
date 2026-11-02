import { slugify } from '@ziarnista/shared';
import { isUniqueViolation } from './prisma-errors';

const MAX_ATTEMPTS = 3;

/** First slug from base, base-2, base-3, ... that is not taken */
export function nextFreeSlug(base: string, taken: readonly string[]): string {
  const used = new Set(taken);
  if (!used.has(base)) {
    return base;
  }
  for (let suffix = 2; ; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
}

export interface UniqueSlugOptions<T> {
  name: string;
  /** Given by hand: used as is, a conflict is the caller's 409 */
  slug: string | undefined;
  /** Unique index on the slug column, e.g. "categories_slug_key" */
  slugIndex: string;
  /** Slugs starting with base (a superset is fine) */
  findTaken: (base: string) => Promise<string[]>;
  create: (slug: string) => Promise<T>;
}

/**
 * Creates a record under a slug generated from its name, with the first free suffix.
 * The read only guesses a free slug: two concurrent requests may pick the same one, and
 * the unique index decides. The loser retries with a fresh read. Must not run inside an
 * interactive transaction, because PostgreSQL aborts it on the failed insert.
 */
export async function createWithUniqueSlug<T>(options: UniqueSlugOptions<T>): Promise<T> {
  if (options.slug !== undefined) {
    return options.create(options.slug);
  }
  const base = slugify(options.name);
  for (let attempt = 1; ; attempt++) {
    const slug = nextFreeSlug(base, await options.findTaken(base));
    try {
      return await options.create(slug);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isUniqueViolation(error, options.slugIndex)) {
        throw error;
      }
    }
  }
}
