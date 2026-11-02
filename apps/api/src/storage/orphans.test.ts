import { describe, expect, it } from 'vitest';
import { findOrphans, ORPHAN_MIN_AGE_MS } from './orphans';

const NOW = new Date('2026-11-02T12:00:00Z');
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 60 * 60 * 1000);

describe('findOrphans', () => {
  const objects = [
    { key: 'products/a/known.webp', lastModified: hoursAgo(48) },
    { key: 'products/a/old-orphan.webp', lastModified: hoursAgo(25) },
    { key: 'products/a/fresh.webp', lastModified: hoursAgo(1) },
  ];

  it('returns objects without a row that are older than 24 hours', () => {
    const orphans = findOrphans(objects, new Set(['products/a/known.webp']), NOW);

    expect(orphans.map((object) => object.key)).toEqual(['products/a/old-orphan.webp']);
  });

  it('keeps an object exactly at the age limit as an orphan, one just younger as not', () => {
    const atLimit = { key: 'x', lastModified: new Date(NOW.getTime() - ORPHAN_MIN_AGE_MS) };
    const justYounger = { key: 'y', lastModified: new Date(NOW.getTime() - ORPHAN_MIN_AGE_MS + 1) };

    expect(findOrphans([atLimit, justYounger], new Set(), NOW)).toEqual([atLimit]);
  });
});
