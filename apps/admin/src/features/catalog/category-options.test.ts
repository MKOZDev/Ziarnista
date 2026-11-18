import { describe, expect, it } from 'vitest';
import { categoryOptions } from './category-options';

describe('categoryOptions', () => {
  it('orders the tree depth-first, siblings by Polish alphabetical order', () => {
    const options = categoryOptions([
      { id: 'zaparzacze', name: 'Zaparzacze', parentId: 'akcesoria' },
      { id: 'kawa', name: 'Kawa', parentId: null },
      { id: 'espresso', name: 'Espresso', parentId: 'kawa' },
      { id: 'akcesoria', name: 'Akcesoria', parentId: null },
      { id: 'mlynki', name: 'Młynki', parentId: 'akcesoria' },
      { id: 'drip', name: 'Drip', parentId: 'przelew' },
      { id: 'przelew', name: 'Przelew', parentId: 'kawa' },
    ]);

    expect(options.map(({ label, depth }) => `${'-'.repeat(depth ?? 0)}${label}`)).toEqual([
      'Akcesoria',
      '-Młynki',
      '-Zaparzacze',
      'Kawa',
      '-Espresso',
      '-Przelew',
      '--Drip',
    ]);
  });

  it('shows a category with a missing parent at the top level', () => {
    expect(categoryOptions([{ id: 'a', name: 'Sierota', parentId: 'gone' }])).toEqual([
      { value: 'a', label: 'Sierota', depth: 0 },
    ]);
  });
});
