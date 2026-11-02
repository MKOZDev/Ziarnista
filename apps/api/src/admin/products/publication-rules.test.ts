import { describe, expect, it } from 'vitest';
import { publicationIssues } from './publication-rules';

describe('publicationIssues', () => {
  it('allows a product with an active variant and an image', () => {
    expect(publicationIssues({ activeVariants: 1, images: 1 })).toEqual([]);
  });

  it('reports a missing image', () => {
    expect(publicationIssues({ activeVariants: 2, images: 0 })).toEqual([
      { path: 'images', message: 'Dodaj co najmniej jedno zdjęcie' },
    ]);
  });

  it('reports all missing parts at once', () => {
    expect(publicationIssues({ activeVariants: 0, images: 0 }).map((issue) => issue.path)).toEqual([
      'variants',
      'images',
    ]);
  });
});
