import { describe, expect, it } from 'vitest';
import { createCategorySchema, createOriginSchema, updateCategorySchema } from './admin-catalog';

const PARENT_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('createCategorySchema', () => {
  it('trims the name and defaults to a top-level category', () => {
    expect(createCategorySchema.parse({ name: '  Kawa  ' })).toEqual({
      name: 'Kawa',
      parentId: null,
    });
  });

  it('accepts a parent and a slug given by hand', () => {
    expect(
      createCategorySchema.parse({ name: 'Drippery', slug: 'dripy', parentId: PARENT_ID }),
    ).toEqual({ name: 'Drippery', slug: 'dripy', parentId: PARENT_ID });
  });

  it('requires a name a slug can be generated from, unless the slug is given', () => {
    const result = createCategorySchema.safeParse({ name: '???' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['name']);
    expect(createCategorySchema.safeParse({ name: '???', slug: 'inne' }).success).toBe(true);
  });

  it('reports an empty name once, not also as a name without letters', () => {
    for (const name of ['', '   ']) {
      const result = createCategorySchema.safeParse({ name });

      expect(result.error?.issues.map((issue) => issue.message)).toEqual(['Podaj nazwę']);
    }
  });

  it('rejects an invalid slug, parent id and unknown fields', () => {
    expect(createCategorySchema.safeParse({ name: 'Kawa', slug: 'Kawa Ziarnista' }).success).toBe(
      false,
    );
    expect(createCategorySchema.safeParse({ name: 'Kawa', parentId: 'abc' }).success).toBe(false);
    expect(createCategorySchema.safeParse({ name: 'Kawa', id: PARENT_ID }).success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('keeps only the fields that were sent; null moves the category to the top level', () => {
    expect(updateCategorySchema.parse({ parentId: null })).toEqual({ parentId: null });
    expect(updateCategorySchema.parse({ name: 'Nowa' })).toEqual({ name: 'Nowa' });
  });

  it('rejects an empty name', () => {
    expect(updateCategorySchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});

describe('createOriginSchema', () => {
  it('accepts a name with Polish letters', () => {
    expect(createOriginSchema.parse({ name: 'Wybrzeże Kości Słoniowej' })).toEqual({
      name: 'Wybrzeże Kości Słoniowej',
    });
  });
});
