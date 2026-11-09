function normalize(text: string) {
  return (
    text
      .trim()
      .toLocaleLowerCase('pl')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      // ł has no decomposed form, so NFD leaves it alone
      .replaceAll('ł', 'l')
  );
}

/** Case- and diacritic-insensitive, so "lodz" finds "Łódź". */
export function matchesQuery(label: string, query: string) {
  return normalize(label).includes(normalize(query));
}
