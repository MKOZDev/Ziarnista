const priceFormat = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

/** Grosze → "49,00 zł". Amounts travel as integers and are only formatted for display. */
export function formatPrice(grosze: number): string {
  return priceFormat.format(grosze / 100);
}
