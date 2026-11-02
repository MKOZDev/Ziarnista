import { describe, expect, it } from 'vitest';
import { productAttributesSchema } from './product';

const ORIGIN_ID = '019a3b2c-0000-7000-8000-000000000001';

const coffee = {
  kind: 'COFFEE',
  originId: ORIGIN_ID,
  roastLevel: 'LIGHT',
  flavorNotes: ['jaśmin', 'bergamotka'],
  brewMethods: ['POUR_OVER'],
};

const accessory = {
  kind: 'ACCESSORY',
  originId: null,
  roastLevel: null,
};

describe('productAttributesSchema', () => {
  it('accepts a coffee with origin and roast level', () => {
    expect(productAttributesSchema.safeParse(coffee).success).toBe(true);
  });

  it('accepts an accessory without coffee fields and defaults the arrays', () => {
    expect(productAttributesSchema.parse(accessory)).toEqual({
      ...accessory,
      flavorNotes: [],
      brewMethods: [],
    });
  });

  it.each([
    { field: 'originId', override: { originId: null } },
    { field: 'roastLevel', override: { roastLevel: null } },
  ])('rejects a coffee without $field', ({ field, override }) => {
    const result = productAttributesSchema.safeParse({ ...coffee, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([[field]]);
  });

  it('normalizes flavor notes to trimmed lowercase', () => {
    const result = productAttributesSchema.parse({
      ...coffee,
      flavorNotes: ['  Czekolada ', 'ŚLIWKA'],
    });
    expect(result.flavorNotes).toEqual(['czekolada', 'śliwka']);
  });

  it('rejects an accessory with an origin or a roast level', () => {
    const result = productAttributesSchema.safeParse({
      ...accessory,
      originId: ORIGIN_ID,
      roastLevel: 'DARK',
    });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([['originId'], ['roastLevel']]);
  });

  it('drops repeated flavor notes and brew methods, keeping the first occurrence', () => {
    const result = productAttributesSchema.parse({
      ...coffee,
      flavorNotes: ['Miód', 'jaśmin', 'miód '],
      brewMethods: ['POUR_OVER', 'ESPRESSO', 'POUR_OVER'],
    });

    expect(result.flavorNotes).toEqual(['miód', 'jaśmin']);
    expect(result.brewMethods).toEqual(['POUR_OVER', 'ESPRESSO']);
  });

  it('rejects empty flavor notes and unknown brew methods', () => {
    expect(productAttributesSchema.safeParse({ ...coffee, flavorNotes: ['  '] }).success).toBe(
      false,
    );
    expect(productAttributesSchema.safeParse({ ...coffee, brewMethods: ['CHEMEX'] }).success).toBe(
      false,
    );
  });
});
