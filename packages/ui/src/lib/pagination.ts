export type PageItem = number | 'gap';

/**
 * The first and last page, the current page and its neighbours, with gaps in between.
 * A gap never hides a single page, since showing that page takes the same space.
 */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  const visible = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((item) => item >= 1 && item <= pageCount)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const item of visible) {
    const hidden = item - previous - 1;
    if (hidden === 1) items.push(item - 1);
    else if (hidden > 1) items.push('gap');
    items.push(item);
    previous = item;
  }
  return items;
}
