/** Singular, 2–4 form and 5+ form, e.g. ['produkt', 'produkty', 'produktów'] */
export type PolishForms = readonly [one: string, few: string, many: string];

/** "1 produkt", "3 produkty", "5 produktów", "12 produktów", "22 produkty" */
export function countPl(count: number, [one, few, many]: PolishForms): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  let form = many;
  if (count === 1) {
    form = one;
  } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    form = few;
  }
  return `${count} ${form}`;
}
