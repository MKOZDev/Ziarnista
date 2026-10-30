import type {
  BrewMethod,
  ProductKind,
  ProductStatus,
  RoastLevel,
} from '../../src/generated/prisma/enums';

// Demo catalog. Natural keys (slug, sku) make the seed idempotent.
// Intentional edge cases for testing filters and the admin panel:
// - etiopia-guji-hambela: inactive variant (250 g / mielona)
// - kenia-nyeri-gatomboya-aa: 1 kg out of stock
// - kenia-kirinyaga-kii: ARCHIVED
// - rwanda-nyamasheke-gitesi: DRAFT
// - mlynek-timemore-c3: white variant out of stock

export type CategorySeed = { slug: string; name: string; parentSlug: string | null };

export type OriginSeed = { slug: string; name: string };

export type VariantSeed = {
  sku: string;
  label: string;
  /** grosze */
  price: number;
  stock: number;
  isActive: boolean;
};

export type ProductSeed = {
  kind: ProductKind;
  slug: string;
  name: string;
  description: string;
  status: ProductStatus;
  categorySlug: string;
  originSlug: string | null;
  roastLevel: RoastLevel | null;
  flavorNotes: string[];
  brewMethods: BrewMethod[];
  variants: VariantSeed[];
};

// Parents before children: the seed creates them in this order
export const categories: CategorySeed[] = [
  { slug: 'kawa', name: 'Kawa', parentSlug: null },
  { slug: 'espresso', name: 'Espresso', parentSlug: 'kawa' },
  { slug: 'przelew', name: 'Przelew', parentSlug: 'kawa' },
  { slug: 'akcesoria', name: 'Akcesoria', parentSlug: null },
];

export const origins: OriginSeed[] = [
  { slug: 'etiopia', name: 'Etiopia' },
  { slug: 'kenia', name: 'Kenia' },
  { slug: 'kolumbia', name: 'Kolumbia' },
  { slug: 'brazylia', name: 'Brazylia' },
  { slug: 'gwatemala', name: 'Gwatemala' },
  { slug: 'rwanda', name: 'Rwanda' },
];

type BagOptions = { stock?: number; isActive?: boolean };

/** Coffee bag variant, e.g. bag('ETH-HAMBELA', 250, 'ziarno', 6900) → sku ETH-HAMBELA-250-Z */
function bag(
  code: string,
  grams: 250 | 500 | 1000,
  grind: 'ziarno' | 'mielona',
  price: number,
  { stock = 25, isActive = true }: BagOptions = {},
): VariantSeed {
  const size = grams === 1000 ? '1 kg' : `${grams} g`;
  return {
    sku: `${code}-${grams}-${grind === 'ziarno' ? 'Z' : 'M'}`,
    label: `${size} / ${grind}`,
    price,
    stock,
    isActive,
  };
}

/** Filter roast: whole bean, ground for drip, 1 kg whole bean */
function filterBags(code: string, price250: number, price1kg: number): VariantSeed[] {
  return [
    bag(code, 250, 'ziarno', price250, { stock: 30 }),
    bag(code, 250, 'mielona', price250, { stock: 15 }),
    bag(code, 1000, 'ziarno', price1kg, { stock: 8 }),
  ];
}

/** Espresso roast: 250 g and 1 kg whole bean */
function espressoBags(code: string, price250: number, price1kg: number): VariantSeed[] {
  return [
    bag(code, 250, 'ziarno', price250, { stock: 40 }),
    bag(code, 1000, 'ziarno', price1kg, { stock: 12 }),
  ];
}

type CoffeeInput = Omit<ProductSeed, 'kind' | 'status' | 'categorySlug'> & {
  status?: ProductStatus;
  originSlug: string;
  roastLevel: RoastLevel;
};

const filterCoffee = (input: CoffeeInput): ProductSeed => ({
  kind: 'COFFEE',
  status: 'ACTIVE',
  categorySlug: 'przelew',
  ...input,
});

const espressoCoffee = (input: CoffeeInput): ProductSeed => ({
  kind: 'COFFEE',
  status: 'ACTIVE',
  categorySlug: 'espresso',
  ...input,
});

const accessory = (
  input: Omit<
    ProductSeed,
    'kind' | 'status' | 'categorySlug' | 'originSlug' | 'roastLevel' | 'flavorNotes'
  >,
): ProductSeed => ({
  kind: 'ACCESSORY',
  status: 'ACTIVE',
  categorySlug: 'akcesoria',
  originSlug: null,
  roastLevel: null,
  flavorNotes: [],
  ...input,
});

export const products: ProductSeed[] = [
  // ---------- Przelew ----------
  filterCoffee({
    slug: 'etiopia-guji-hambela',
    name: 'Etiopia Guji Hambela',
    description:
      'Myta kawa z regionu Guji, uprawiana na wysokości ponad 2000 m n.p.m. Klarowna, kwiatowa i słodka — klasyka jasnego palenia.',
    originSlug: 'etiopia',
    roastLevel: 'LIGHT',
    flavorNotes: ['jaśmin', 'bergamotka', 'brzoskwinia'],
    brewMethods: ['POUR_OVER', 'AEROPRESS'],
    variants: [
      bag('ETH-HAMBELA', 250, 'ziarno', 6900, { stock: 30 }),
      bag('ETH-HAMBELA', 250, 'mielona', 6900, { stock: 0, isActive: false }),
      bag('ETH-HAMBELA', 1000, 'ziarno', 23900, { stock: 6 }),
    ],
  }),
  filterCoffee({
    slug: 'etiopia-yirgacheffe-konga',
    name: 'Etiopia Yirgacheffe Konga',
    description:
      'Stacja obróbki Konga w sercu Yirgacheffe. Lekka, herbaciana kawa o wyraźnej cytrusowej kwasowości.',
    originSlug: 'etiopia',
    roastLevel: 'LIGHT',
    flavorNotes: ['cytryna', 'earl grey', 'kwiat pomarańczy'],
    brewMethods: ['POUR_OVER', 'AEROPRESS'],
    variants: filterBags('ETH-KONGA', 6500, 22900),
  }),
  filterCoffee({
    slug: 'etiopia-sidamo-bensa-natural',
    name: 'Etiopia Sidamo Bensa Natural',
    description:
      'Kawa suszona w całych owocach, co daje intensywną owocowość i dżemową słodycz. Dla lubiących wyraziste smaki.',
    originSlug: 'etiopia',
    roastLevel: 'LIGHT',
    flavorNotes: ['truskawka', 'borówka', 'mleczna czekolada'],
    brewMethods: ['POUR_OVER', 'AEROPRESS', 'FRENCH_PRESS'],
    variants: filterBags('ETH-BENSA', 7200, 24900),
  }),
  filterCoffee({
    slug: 'kenia-nyeri-gatomboya-aa',
    name: 'Kenia Nyeri Gatomboya AA',
    description:
      'Największe ziarna (AA) ze spółdzielni Gatomboya. Soczysta, winna kwasowość i głębokie nuty czarnych owoców.',
    originSlug: 'kenia',
    roastLevel: 'LIGHT',
    flavorNotes: ['czarna porzeczka', 'grejpfrut', 'rabarbar'],
    brewMethods: ['POUR_OVER', 'AEROPRESS'],
    variants: [
      bag('KEN-GATOMBOYA', 250, 'ziarno', 7900, { stock: 20 }),
      bag('KEN-GATOMBOYA', 250, 'mielona', 7900, { stock: 10 }),
      bag('KEN-GATOMBOYA', 1000, 'ziarno', 27900, { stock: 0 }),
    ],
  }),
  filterCoffee({
    slug: 'kenia-kirinyaga-kii',
    name: 'Kenia Kirinyaga Kii',
    description: 'Sezonowa partia ze stacji Kii. Zakończona — zostaje w archiwum.',
    status: 'ARCHIVED',
    originSlug: 'kenia',
    roastLevel: 'LIGHT',
    flavorNotes: ['jeżyna', 'żurawina', 'cukier trzcinowy'],
    brewMethods: ['POUR_OVER', 'AEROPRESS'],
    variants: filterBags('KEN-KII', 7400, 25900),
  }),
  filterCoffee({
    slug: 'kolumbia-huila-el-mirador',
    name: 'Kolumbia Huila El Mirador',
    description:
      'Rodzinna farma El Mirador w departamencie Huila. Zbalansowana, słodka kawa na co dzień.',
    originSlug: 'kolumbia',
    roastLevel: 'LIGHT',
    flavorNotes: ['czerwone jabłko', 'karmel', 'panela'],
    brewMethods: ['POUR_OVER', 'AEROPRESS', 'FRENCH_PRESS'],
    variants: filterBags('COL-MIRADOR', 5900, 19900),
  }),
  filterCoffee({
    slug: 'kolumbia-narino-decaf',
    name: 'Kolumbia Nariño Decaf',
    description:
      'Bezkofeinowa, dekofeinizowana naturalnym octanem etylu z trzciny cukrowej. Pełny smak, bez kofeiny.',
    originSlug: 'kolumbia',
    roastLevel: 'MEDIUM',
    flavorNotes: ['mleczna czekolada', 'wiśnia', 'trzcina cukrowa'],
    brewMethods: ['POUR_OVER', 'FRENCH_PRESS', 'AEROPRESS'],
    variants: filterBags('COL-DECAF', 5400, 18900),
  }),
  filterCoffee({
    slug: 'rwanda-nyamasheke-gitesi',
    name: 'Rwanda Nyamasheke Gitesi',
    description: 'Nowa partia w przygotowaniu — opis i ceny do uzupełnienia.',
    status: 'DRAFT',
    originSlug: 'rwanda',
    roastLevel: 'LIGHT',
    flavorNotes: ['czerwona porzeczka', 'hibiskus', 'miód'],
    brewMethods: ['POUR_OVER', 'AEROPRESS'],
    variants: filterBags('RWA-GITESI', 6400, 22900),
  }),
  filterCoffee({
    slug: 'gwatemala-huehuetenango-la-esperanza',
    name: 'Gwatemala Huehuetenango La Esperanza',
    description:
      'Wysokogórska kawa z Huehuetenango. Czekoladowa baza i delikatna cytrusowa świeżość.',
    originSlug: 'gwatemala',
    roastLevel: 'MEDIUM',
    flavorNotes: ['mleczna czekolada', 'orzech laskowy', 'pomarańcza'],
    brewMethods: ['POUR_OVER', 'FRENCH_PRESS', 'AEROPRESS'],
    variants: filterBags('GTM-ESPERANZA', 5600, 19500),
  }),

  // ---------- Espresso ----------
  espressoCoffee({
    slug: 'brazylia-cerrado-mineiro',
    name: 'Brazylia Cerrado Mineiro',
    description:
      'Klasyczna baza espresso: niska kwasowość, gęste body i czekoladowa słodycz. Świetna z mlekiem.',
    originSlug: 'brazylia',
    roastLevel: 'DARK',
    flavorNotes: ['gorzka czekolada', 'orzechy', 'kakao'],
    brewMethods: ['ESPRESSO', 'MOKA', 'FRENCH_PRESS'],
    variants: [
      bag('BRA-CERRADO', 250, 'ziarno', 4500, { stock: 50 }),
      bag('BRA-CERRADO', 250, 'mielona', 4500, { stock: 20 }),
      bag('BRA-CERRADO', 500, 'ziarno', 8500, { stock: 15 }),
      bag('BRA-CERRADO', 1000, 'ziarno', 15900, { stock: 10 }),
    ],
  }),
  espressoCoffee({
    slug: 'brazylia-mogiana-pulped-natural',
    name: 'Brazylia Mogiana Pulped Natural',
    description:
      'Obróbka pulped natural podkręca słodycz. Karmelowe espresso, które wybacza błędy w ustawieniach.',
    originSlug: 'brazylia',
    roastLevel: 'MEDIUM',
    flavorNotes: ['mleczna czekolada', 'karmel', 'migdały'],
    brewMethods: ['ESPRESSO', 'MOKA'],
    variants: espressoBags('BRA-MOGIANA', 4900, 16900),
  }),
  espressoCoffee({
    slug: 'kolumbia-tolima-excelso',
    name: 'Kolumbia Tolima Excelso',
    description: 'Słodkie, owocowe espresso z Tolimy. Dobrze sprawdza się solo i w cappuccino.',
    originSlug: 'kolumbia',
    roastLevel: 'MEDIUM',
    flavorNotes: ['czekolada', 'wiśnia', 'trzcina cukrowa'],
    brewMethods: ['ESPRESSO', 'MOKA', 'AEROPRESS'],
    variants: espressoBags('COL-TOLIMA', 5200, 17900),
  }),
  espressoCoffee({
    slug: 'gwatemala-antigua',
    name: 'Gwatemala Antigua',
    description:
      'Wulkaniczne gleby Antigui i ciemniejsze palenie: intensywne, korzenne espresso o długim finiszu.',
    originSlug: 'gwatemala',
    roastLevel: 'DARK',
    flavorNotes: ['ciemna czekolada', 'przyprawy korzenne', 'melasa'],
    brewMethods: ['ESPRESSO', 'MOKA'],
    variants: [
      bag('GTM-ANTIGUA', 250, 'ziarno', 5500, { stock: 35 }),
      bag('GTM-ANTIGUA', 250, 'mielona', 5500, { stock: 15 }),
      bag('GTM-ANTIGUA', 1000, 'ziarno', 18900, { stock: 8 }),
    ],
  }),
  espressoCoffee({
    slug: 'etiopia-sidamo-shantawene',
    name: 'Etiopia Sidamo Shantawene',
    description:
      'Etiopia w wersji espresso: owocowa i kwiatowa, dla tych, którzy szukają czegoś jaśniejszego niż klasyka.',
    originSlug: 'etiopia',
    roastLevel: 'MEDIUM',
    flavorNotes: ['jagody', 'mleczna czekolada', 'kwiaty'],
    brewMethods: ['ESPRESSO', 'AEROPRESS'],
    variants: espressoBags('ETH-SHANTAWENE', 6200, 21900),
  }),
  espressoCoffee({
    slug: 'rwanda-huye-mountain',
    name: 'Rwanda Huye Mountain',
    description: 'Czerwone owoce i karmel w zbalansowanym espresso ze stacji Huye Mountain.',
    originSlug: 'rwanda',
    roastLevel: 'MEDIUM',
    flavorNotes: ['czerwone owoce', 'karmel', 'kakao'],
    brewMethods: ['ESPRESSO', 'MOKA', 'AEROPRESS'],
    variants: espressoBags('RWA-HUYE', 5900, 20900),
  }),

  // ---------- Akcesoria ----------
  accessory({
    slug: 'drip-hario-v60-02',
    name: 'Drip Hario V60 02',
    description:
      'Stożkowy drip do parzenia 1–4 filiżanek. Spiralne żeberka i duży otwór dają pełną kontrolę nad przepływem.',
    brewMethods: ['POUR_OVER'],
    variants: [
      { sku: 'HARIO-V60-02-PL', label: 'plastik', price: 3900, stock: 25, isActive: true },
      { sku: 'HARIO-V60-02-CER', label: 'ceramika', price: 11900, stock: 10, isActive: true },
    ],
  }),
  accessory({
    slug: 'filtry-hario-v60-02',
    name: 'Filtry papierowe Hario V60 02',
    description: 'Oryginalne, bielone filtry do dripa V60 02.',
    brewMethods: ['POUR_OVER'],
    variants: [
      { sku: 'HARIO-VCF02-100', label: '100 szt.', price: 2400, stock: 60, isActive: true },
      { sku: 'HARIO-VCF02-300', label: '3 × 100 szt.', price: 6500, stock: 20, isActive: true },
    ],
  }),
  accessory({
    slug: 'aeropress-clear',
    name: 'AeroPress Clear',
    description: 'Przezroczysty AeroPress z tritanu. Szybkie, czyste parzenie w domu i w podróży.',
    brewMethods: ['AEROPRESS'],
    variants: [
      { sku: 'AEROPRESS-CLEAR', label: 'przezroczysty', price: 18900, stock: 12, isActive: true },
    ],
  }),
  accessory({
    slug: 'mlynek-timemore-c3',
    name: 'Młynek ręczny Timemore Chestnut C3',
    description: 'Ręczny młynek ze stalowymi żarnami. Równe mielenie od dripa po french press.',
    brewMethods: ['POUR_OVER', 'AEROPRESS', 'FRENCH_PRESS', 'MOKA'],
    variants: [
      { sku: 'TIMEMORE-C3-BLK', label: 'czarny', price: 34900, stock: 7, isActive: true },
      { sku: 'TIMEMORE-C3-WHT', label: 'biały', price: 34900, stock: 0, isActive: true },
    ],
  }),
  accessory({
    slug: 'waga-timemore-black-mirror',
    name: 'Waga Timemore Black Mirror Basic 2',
    description: 'Waga z timerem i dokładnością 0,1 g. Do przelewu i espresso.',
    brewMethods: ['POUR_OVER', 'ESPRESSO'],
    variants: [{ sku: 'TIMEMORE-BM2', label: 'czarna', price: 22900, stock: 9, isActive: true }],
  }),
];
