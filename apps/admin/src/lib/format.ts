const priceFormat = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

/** Grosze → "49,00 zł". Amounts travel as integers and are only formatted for display. */
export function formatPrice(grosze: number): string {
  return priceFormat.format(grosze / 100);
}

/** Polish nouns have three plural forms: 1 produkt, 2 produkty, 5 produktów */
export type PluralForms = { one: string; few: string; many: string };

const pluralRules = new Intl.PluralRules('pl-PL');

/** "3 produkty"; the form comes from the CLDR rules, so 12–14 and 22–24 are right too */
export function formatCount(count: number, forms: PluralForms): string {
  const category = pluralRules.select(count);
  const noun = category === 'one' ? forms.one : category === 'few' ? forms.few : forms.many;
  return `${count} ${noun}`;
}
