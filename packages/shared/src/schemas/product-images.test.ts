import { describe, expect, it } from 'vitest';
import { reorderImagesSchema, uploadImageSchema } from './product-images';

const A = '01923456-789a-7bcd-8ef0-123456789abc';
const B = '01923456-789a-7bcd-8ef0-123456789abd';

describe('uploadImageSchema', () => {
  it('trims the alt text and requires it', () => {
    expect(uploadImageSchema.parse({ alt: ' Opakowanie kawy ' })).toEqual({
      alt: 'Opakowanie kawy',
    });
    expect(uploadImageSchema.safeParse({ alt: '   ' }).success).toBe(false);
    expect(uploadImageSchema.safeParse({}).success).toBe(false);
  });
});

describe('reorderImagesSchema', () => {
  it('accepts distinct ids', () => {
    expect(reorderImagesSchema.parse({ imageIds: [B, A] })).toEqual({ imageIds: [B, A] });
  });

  it('rejects a repeated id and an empty list', () => {
    expect(reorderImagesSchema.safeParse({ imageIds: [A, A] }).success).toBe(false);
    expect(reorderImagesSchema.safeParse({ imageIds: [] }).success).toBe(false);
  });
});
