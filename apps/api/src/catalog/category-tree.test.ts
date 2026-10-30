import { describe, expect, it } from 'vitest';
import { CategoryTree, type CategoryRow } from './category-tree';

const row = (id: string, parentId: string | null, name = id): CategoryRow => ({
  id,
  parentId,
  slug: id,
  name,
});

// kawa
// ├── espresso
// └── przelew
//     └── drip
// akcesoria
const rows = [
  row('drip', 'przelew', 'Drip'),
  row('przelew', 'kawa', 'Przelew'),
  row('espresso', 'kawa', 'Espresso'),
  row('kawa', null, 'Kawa'),
  row('akcesoria', null, 'Akcesoria'),
];

describe('CategoryTree', () => {
  const tree = new CategoryTree(rows);

  it('finds a category by slug', () => {
    expect(tree.findBySlug('espresso')?.id).toBe('espresso');
    expect(tree.findBySlug('herbata')).toBeUndefined();
  });

  describe('descendantIds', () => {
    it('includes the category and all levels below it', () => {
      expect(tree.descendantIds('kawa').sort()).toEqual(['drip', 'espresso', 'kawa', 'przelew']);
    });

    it('returns only the category itself for a leaf', () => {
      expect(tree.descendantIds('drip')).toEqual(['drip']);
    });

    it('returns nothing for an unknown id', () => {
      expect(tree.descendantIds('herbata')).toEqual([]);
    });

    it('stops on a cycle in parent_id', () => {
      const cyclic = new CategoryTree([row('a', 'b'), row('b', 'a')]);
      expect(cyclic.descendantIds('a').sort()).toEqual(['a', 'b']);
    });
  });

  describe('path', () => {
    it('goes from the root down to the category', () => {
      expect(tree.path('drip').map((c) => c.slug)).toEqual(['kawa', 'przelew', 'drip']);
    });

    it('is a single element for a root', () => {
      expect(tree.path('akcesoria')).toEqual([{ slug: 'akcesoria', name: 'Akcesoria' }]);
    });

    it('stops on a cycle in parent_id', () => {
      const cyclic = new CategoryTree([row('a', 'b'), row('b', 'a')]);
      expect(cyclic.path('a').map((c) => c.slug)).toEqual(['b', 'a']);
    });
  });

  describe('toNodes', () => {
    it('nests children sorted by name and rolls product counts up to parents', () => {
      const nodes = tree.toNodes(
        new Map([
          ['espresso', 2],
          ['drip', 3],
          ['przelew', 1],
          ['akcesoria', 4],
        ]),
      );

      expect(nodes.map((n) => [n.slug, n.productCount])).toEqual([
        ['akcesoria', 4],
        ['kawa', 6],
      ]);
      const kawa = nodes[1];
      expect(kawa?.children.map((n) => [n.slug, n.productCount])).toEqual([
        ['espresso', 2],
        ['przelew', 4],
      ]);
      expect(kawa?.children[1]?.children).toEqual([
        { id: 'drip', slug: 'drip', name: 'Drip', productCount: 3, children: [] },
      ]);
    });

    it('gives 0 to categories without products', () => {
      expect(tree.toNodes(new Map()).every((n) => n.productCount === 0)).toBe(true);
    });

    it('sorts by Polish alphabet', () => {
      // By code point "Ł" (U+0141) would come after "M"
      const polish = new CategoryTree([row('m', null, 'Młynki'), row('l', null, 'Łyżeczki')]);
      expect(polish.toNodes(new Map()).map((n) => n.name)).toEqual(['Łyżeczki', 'Młynki']);
    });
  });
});
