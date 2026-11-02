import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../generated/prisma/client';
import { createWithUniqueSlug, nextFreeSlug } from './unique-slug';

const SLUG_INDEX = 'categories_slug_key';

function slugTaken(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { constraint: { index: SLUG_INDEX } } } },
  });
}

describe('nextFreeSlug', () => {
  it('returns the base when it is free', () => {
    expect(nextFreeSlug('kawa', ['kawa-ziarnista'])).toBe('kawa');
  });

  it('appends the first free suffix, starting from 2', () => {
    expect(nextFreeSlug('kawa', ['kawa'])).toBe('kawa-2');
    expect(nextFreeSlug('kawa', ['kawa', 'kawa-2', 'kawa-4'])).toBe('kawa-3');
  });
});

describe('createWithUniqueSlug', () => {
  it('generates the slug from the name', async () => {
    const create = vi.fn((slug: string) => Promise.resolve(slug));

    const slug = await createWithUniqueSlug({
      name: 'Łódź Żółta',
      slug: undefined,
      slugIndex: SLUG_INDEX,
      findTaken: () => Promise.resolve(['lodz-zolta']),
      create,
    });

    expect(slug).toBe('lodz-zolta-2');
  });

  it('uses a slug given by hand without reading taken slugs', async () => {
    const findTaken = vi.fn(() => Promise.resolve([]));

    const slug = await createWithUniqueSlug({
      name: 'Kawa',
      slug: 'moja-kawa',
      slugIndex: SLUG_INDEX,
      findTaken,
      create: (value) => Promise.resolve(value),
    });

    expect(slug).toBe('moja-kawa');
    expect(findTaken).not.toHaveBeenCalled();
  });

  it('retries with a fresh read when a concurrent request took the slug', async () => {
    const taken: string[] = [];
    const create = vi
      .fn<(slug: string) => Promise<string>>()
      .mockImplementationOnce(() => {
        taken.push('kawa');
        return Promise.reject(slugTaken());
      })
      .mockImplementation((slug) => Promise.resolve(slug));

    const slug = await createWithUniqueSlug({
      name: 'Kawa',
      slug: undefined,
      slugIndex: SLUG_INDEX,
      findTaken: () => Promise.resolve([...taken]),
      create,
    });

    expect(slug).toBe('kawa-2');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors', async () => {
    const create = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(
      createWithUniqueSlug({
        name: 'Kawa',
        slug: undefined,
        slugIndex: SLUG_INDEX,
        findTaken: () => Promise.resolve([]),
        create,
      }),
    ).rejects.toThrow('boom');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('gives up after 3 attempts', async () => {
    const create = vi.fn(() => Promise.reject(slugTaken()));

    await expect(
      createWithUniqueSlug({
        name: 'Kawa',
        slug: undefined,
        slugIndex: SLUG_INDEX,
        findTaken: () => Promise.resolve([]),
        create,
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(create).toHaveBeenCalledTimes(3);
  });
});
