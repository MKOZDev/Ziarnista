const MONEY_PATTERN = /^(\d+)(?:[.,](\d{0,2}))?$/;

/**
 * Converts text typed in złoty to grosze. Returns null for empty or malformed text.
 * Uses integers only: 19.99 * 100 is 1998.9999999999998 in floating point.
 * More than two decimals is malformed rather than rounded, so a price never changes silently.
 */
export function parseMoney(text: string): number | null {
  const match = MONEY_PATTERN.exec(text.replace(/\s/g, ''));
  if (!match) return null;

  const grosze = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(grosze) ? grosze : null;
}

/** Formats grosze as text for an input, e.g. 1250 becomes "12,50". */
export function formatMoneyInput(grosze: number | null): string {
  if (grosze === null) return '';
  return `${Math.trunc(grosze / 100)},${String(grosze % 100).padStart(2, '0')}`;
}
