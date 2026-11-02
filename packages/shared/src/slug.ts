export const SLUG_MAX_LENGTH = 200;
/** A generated slug leaves room for a collision suffix (-2, -3, ...) within SLUG_MAX_LENGTH */
export const SLUG_BASE_MAX_LENGTH = 190;

// Letters that are not "base letter + diacritic", so NFD does not split them
const SEPARATE_LETTERS: Record<string, string> = {
  ł: 'l',
  đ: 'd',
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
};

/**
 * URL slug from a name: "Łódzka Żółć – 250 g" → "lodzka-zolc-250-g".
 * Lowercase latin letters, digits and single hyphens; empty when the name has none.
 * Shared with the admin panel, so the form can preview the slug the API will generate.
 */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      // "ż" → "z" + combining dot; the combining marks are removed below
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[łđøæœß]/g, (letter) => SEPARATE_LETTERS[letter] ?? letter)
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, SLUG_BASE_MAX_LENGTH)
      .replace(/^-+|-+$/g, '')
  );
}
