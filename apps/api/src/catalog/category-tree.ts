import type { CategoryNode, NamedRef } from '@ziarnista/shared';

export type CategoryRow = { id: string; parentId: string | null; slug: string; name: string };

/**
 * The whole category table held in memory. It is a small, admin-managed navigation tree,
 * so loading it in one query is cheaper and simpler than a recursive CTE, and the same
 * structure answers all three questions the catalog asks: subcategories (filter),
 * path (breadcrumbs) and per-node totals (GET /categories).
 *
 * The database does not prevent cycles in parent_id; every walk tracks visited nodes,
 * and categories that cannot be reached from a root are left out of the tree.
 */
export class CategoryTree {
  private readonly byId = new Map<string, CategoryRow>();
  private readonly bySlug = new Map<string, CategoryRow>();
  private readonly childrenOf = new Map<string | null, CategoryRow[]>();

  constructor(rows: readonly CategoryRow[]) {
    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    for (const row of sorted) {
      this.byId.set(row.id, row);
      this.bySlug.set(row.slug, row);
      const siblings = this.childrenOf.get(row.parentId) ?? [];
      siblings.push(row);
      this.childrenOf.set(row.parentId, siblings);
    }
  }

  findBySlug(slug: string): CategoryRow | undefined {
    return this.bySlug.get(slug);
  }

  /** The category itself and all categories below it */
  descendantIds(id: string): string[] {
    const ids: string[] = [];
    const visited = new Set<string>();
    const stack = [id];
    for (let current = stack.pop(); current !== undefined; current = stack.pop()) {
      if (visited.has(current) || !this.byId.has(current)) {
        continue;
      }
      visited.add(current);
      ids.push(current);
      for (const child of this.childrenOf.get(current) ?? []) {
        stack.push(child.id);
      }
    }
    return ids;
  }

  /** From the root down to the category (inclusive); empty for an unknown id */
  path(id: string): NamedRef[] {
    const path: NamedRef[] = [];
    const visited = new Set<string>();
    for (let row = this.byId.get(id); row && !visited.has(row.id);) {
      visited.add(row.id);
      path.unshift({ slug: row.slug, name: row.name });
      row = row.parentId === null ? undefined : this.byId.get(row.parentId);
    }
    return path;
  }

  /**
   * Nested tree sorted by name; productCount of a node includes all its subcategories
   * (the same rule as the category filter). directCounts: category id → own product count.
   */
  toNodes(directCounts: ReadonlyMap<string, number>): CategoryNode[] {
    const visited = new Set<string>();
    const build = (row: CategoryRow): CategoryNode => {
      visited.add(row.id);
      const children = (this.childrenOf.get(row.id) ?? [])
        .filter((child) => !visited.has(child.id))
        .map(build);
      const productCount = children.reduce(
        (sum, child) => sum + child.productCount,
        directCounts.get(row.id) ?? 0,
      );
      return { id: row.id, slug: row.slug, name: row.name, productCount, children };
    };
    return (this.childrenOf.get(null) ?? []).map(build);
  }
}
