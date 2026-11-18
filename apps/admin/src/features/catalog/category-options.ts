import type { ComboboxOption } from '@ziarnista/ui/combobox';

type CategoryNode = { id: string; name: string; parentId: string | null };

const byName = (a: CategoryNode, b: CategoryNode) => a.name.localeCompare(b.name, 'pl');

/**
 * Flat list → options in tree order (each parent followed by its children, siblings by
 * name), with depth for indentation. A category whose parent is missing from the list is
 * shown at the top level rather than dropped.
 */
export function categoryOptions(categories: readonly CategoryNode[]): ComboboxOption[] {
  const ids = new Set(categories.map((category) => category.id));
  const children = new Map<string | null, CategoryNode[]>();
  for (const category of categories) {
    const parentId =
      category.parentId !== null && ids.has(category.parentId) ? category.parentId : null;
    children.set(parentId, [...(children.get(parentId) ?? []), category]);
  }

  const options: ComboboxOption[] = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const category of [...(children.get(parentId) ?? [])].sort(byName)) {
      options.push({ value: category.id, label: category.name, depth });
      visit(category.id, depth + 1);
    }
  };
  visit(null, 0);
  return options;
}
