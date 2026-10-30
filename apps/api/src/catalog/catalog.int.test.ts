import type {
  CategoryNode,
  ProductDetail,
  ProductListItem,
  ProductListResponse,
} from '@ziarnista/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createCategory,
  createOrigin,
  createProduct,
  type ProductFixture,
} from '../../test/catalog-fixtures';
import { createTestApp, resetDatabase, type TestApp } from '../../test/test-app';

// Visible (ACTIVE with an active variant), newest last:
//   slug             category   origin    roast   brew methods           minPrice
//   etiopia-guji     przelew    etiopia   LIGHT   POUR_OVER, AEROPRESS    4900 (+ inactive 100)
//   kenia-nyeri      przelew    kenia     LIGHT   POUR_OVER               5900 (out of stock)
//   brazylia-cerrado espresso   brazylia  DARK    ESPRESSO, MOKA          3900
//   etiopia-sidamo   espresso   etiopia   MEDIUM  ESPRESSO, AEROPRESS     5900
//   drip-v60         akcesoria  -         -       -                       2900
//   lyzka-miarka     akcesoria  -         -       -                       1500
//   mlynek-reczny    akcesoria  -         -       -                      19900
// Hidden: a DRAFT, an ARCHIVED and an ACTIVE product whose only variant is inactive.
const VISIBLE = [
  'etiopia-guji',
  'kenia-nyeri',
  'brazylia-cerrado',
  'etiopia-sidamo',
  'drip-v60',
  'lyzka-miarka',
  'mlynek-reczny',
];
const HIDDEN = ['rwanda-szkic', 'kenia-archiwum', 'kolumbia-bez-wariantow'];

describe('public catalog (/products, /categories)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    await seedCatalog(t);
  });

  afterAll(async () => {
    await t.app.close();
  });

  async function list(query = ''): Promise<ProductListResponse> {
    const response = await request(t.server).get(`/api/v1/products${query}`).expect(200);
    return response.body as ProductListResponse;
  }

  const slugs = (body: ProductListResponse) => body.items.map((item) => item.slug);

  describe('GET /products', () => {
    it('lists only visible products, newest first, with default pagination', async () => {
      const body = await list();

      expect(slugs(body)).toEqual([...VISIBLE].reverse());
      expect(body).toMatchObject({ page: 1, pageSize: 24, total: 7, totalPages: 1 });
      for (const hidden of HIDDEN) {
        expect(slugs(body)).not.toContain(hidden);
      }
    });

    it('returns list items with origin, first image and stock flag', async () => {
      const body = await list();
      const guji = body.items.find((item) => item.slug === 'etiopia-guji');
      const kenia = body.items.find((item) => item.slug === 'kenia-nyeri');
      const v60 = body.items.find((item) => item.slug === 'drip-v60');

      expect(guji).toEqual<ProductListItem>({
        id: expect.any(String) as string,
        slug: 'etiopia-guji',
        name: 'Etiopia Guji',
        kind: 'COFFEE',
        // the inactive 1,00 zł variant does not count
        minPrice: 4900,
        roastLevel: 'LIGHT',
        origin: { slug: 'etiopia', name: 'Etiopia' },
        flavorNotes: ['jaśmin', 'brzoskwinia'],
        brewMethods: ['POUR_OVER', 'AEROPRESS'],
        image: { url: 'guji-front.webp', alt: 'Etiopia Guji 0' },
        inStock: true,
      });
      expect(kenia?.inStock).toBe(false);
      expect(v60).toMatchObject({ kind: 'ACCESSORY', origin: null, roastLevel: null, image: null });
    });

    describe('filters', () => {
      it.each([
        {
          query: '?category=kawa',
          expected: ['etiopia-guji', 'kenia-nyeri', 'brazylia-cerrado', 'etiopia-sidamo'],
        },
        { query: '?category=espresso', expected: ['brazylia-cerrado', 'etiopia-sidamo'] },
        { query: '?category=herbata', expected: [] },
        { query: '?kind=ACCESSORY', expected: ['drip-v60', 'lyzka-miarka', 'mlynek-reczny'] },
        { query: '?origin=etiopia', expected: ['etiopia-guji', 'etiopia-sidamo'] },
        { query: '?origin=peru', expected: [] },
        { query: '?roastLevel=LIGHT', expected: ['etiopia-guji', 'kenia-nyeri'] },
        { query: '?brewMethod=ESPRESSO', expected: ['brazylia-cerrado', 'etiopia-sidamo'] },
        {
          // any of the methods, not all of them
          query: '?brewMethod=MOKA&brewMethod=POUR_OVER',
          expected: ['etiopia-guji', 'kenia-nyeri', 'brazylia-cerrado'],
        },
        {
          // bounds are inclusive
          query: '?priceMin=3900&priceMax=5900',
          expected: ['etiopia-guji', 'kenia-nyeri', 'brazylia-cerrado', 'etiopia-sidamo'],
        },
        { query: '?priceMin=19900', expected: ['mlynek-reczny'] },
        { query: '?q=ETIOPIA', expected: ['etiopia-guji', 'etiopia-sidamo'] },
        { query: '?q=ny', expected: ['kenia-nyeri', 'mlynek-reczny'] },
        // LIKE wildcards are matched literally
        { query: '?q=%25', expected: [] },
        { query: '?q=_', expected: [] },
      ])('$query', async ({ query, expected }) => {
        const body = await list(query);
        expect(slugs(body).sort()).toEqual([...expected].sort());
        expect(body.total).toBe(expected.length);
      });

      it('combines filters', async () => {
        const body = await list('?category=kawa&roastLevel=LIGHT&priceMax=5000');
        expect(slugs(body)).toEqual(['etiopia-guji']);
      });

      it('combines a facet filter with brew methods and kind', async () => {
        const body = await list('?kind=COFFEE&origin=etiopia&brewMethod=AEROPRESS&q=sidamo');
        expect(slugs(body)).toEqual(['etiopia-sidamo']);
      });
    });

    describe('sorting', () => {
      it('sorts by price ascending, ties broken by id', async () => {
        const body = await list('?sort=price_asc');
        expect(body.items.map((item) => item.minPrice)).toEqual([
          1500, 2900, 3900, 4900, 5900, 5900, 19900,
        ]);
        const tied = body.items.filter((item) => item.minPrice === 5900).map((item) => item.id);
        expect(tied).toEqual([...tied].sort());
      });

      it('sorts by price descending', async () => {
        const body = await list('?sort=price_desc');
        expect(body.items.map((item) => item.minPrice)).toEqual([
          19900, 5900, 5900, 4900, 3900, 2900, 1500,
        ]);
      });

      it('sorts by name in Polish alphabetical order', async () => {
        const body = await list('?sort=name');
        expect(body.items.map((item) => item.name)).toEqual([
          'Brazylia Cerrado',
          'Drip V60',
          'Etiopia Guji',
          'Etiopia Sidamo',
          'Kenia Nyeri',
          'Łyżka miarka',
          'Młynek ręczny',
        ]);
      });
    });

    describe('pagination', () => {
      it('splits results into pages without gaps or duplicates', async () => {
        const pages = await Promise.all([1, 2, 3].map((page) => list(`?pageSize=3&page=${page}`)));

        expect(pages.map((body) => body.items.length)).toEqual([3, 3, 1]);
        expect(pages.flatMap(slugs)).toEqual([...VISIBLE].reverse());
        for (const body of pages) {
          expect(body).toMatchObject({ pageSize: 3, total: 7, totalPages: 3 });
        }
      });

      it('returns an empty page past the end', async () => {
        const body = await list('?pageSize=3&page=4');
        expect(body).toMatchObject({ items: [], page: 4, total: 7, totalPages: 3 });
      });

      it('accepts the maximum page size', async () => {
        const body = await list('?pageSize=48');
        expect(body.pageSize).toBe(48);
      });

      it('reports 0 pages when nothing matches', async () => {
        const body = await list('?q=herbata');
        expect(body).toMatchObject({ items: [], total: 0, totalPages: 0 });
      });
    });

    describe('facets', () => {
      it('counts visible products per value', async () => {
        const { facets } = await list();

        expect(facets).toEqual({
          origin: [
            { slug: 'brazylia', name: 'Brazylia', count: 1 },
            { slug: 'etiopia', name: 'Etiopia', count: 2 },
            { slug: 'kenia', name: 'Kenia', count: 1 },
          ],
          roastLevel: [
            { value: 'LIGHT', count: 2 },
            { value: 'MEDIUM', count: 1 },
            { value: 'DARK', count: 1 },
          ],
          // FRENCH_PRESS has no products, so it is left out
          brewMethod: [
            { value: 'ESPRESSO', count: 2 },
            { value: 'POUR_OVER', count: 2 },
            { value: 'AEROPRESS', count: 2 },
            { value: 'MOKA', count: 1 },
          ],
        });
      });

      it('ignores its own filter and applies the others', async () => {
        const { facets, total } = await list('?origin=etiopia&roastLevel=LIGHT');

        expect(total).toBe(1);
        // origin facet: roastLevel=LIGHT only (Etiopia Guji, Kenia Nyeri)
        expect(facets.origin).toEqual([
          { slug: 'etiopia', name: 'Etiopia', count: 1 },
          { slug: 'kenia', name: 'Kenia', count: 1 },
        ]);
        // roastLevel facet: origin=etiopia only (Guji LIGHT, Sidamo MEDIUM)
        expect(facets.roastLevel).toEqual([
          { value: 'LIGHT', count: 1 },
          { value: 'MEDIUM', count: 1 },
        ]);
        // brewMethod facet: both filters (Guji)
        expect(facets.brewMethod).toEqual([
          { value: 'POUR_OVER', count: 1 },
          { value: 'AEROPRESS', count: 1 },
        ]);
      });

      it('applies the common filters to every facet', async () => {
        const { facets } = await list('?category=espresso&brewMethod=MOKA');

        expect(facets.origin).toEqual([{ slug: 'brazylia', name: 'Brazylia', count: 1 }]);
        // brewMethod facet ignores brewMethod=MOKA but keeps category=espresso
        expect(facets.brewMethod).toEqual([
          { value: 'ESPRESSO', count: 2 },
          { value: 'AEROPRESS', count: 1 },
          { value: 'MOKA', count: 1 },
        ]);
      });
    });

    describe('validation', () => {
      it.each([
        '?roastLevel=BLONDE',
        '?kind=coffee',
        '?brewMethod=ESPRESSO&brewMethod=SIPHON',
        '?sort=cheapest',
        '?pageSize=49',
        '?page=0',
        '?priceMin=abc',
        '?priceMin=9000&priceMax=1000',
        '?category=Kawa%20Ziarnista',
        '?pricemin=100',
      ])('rejects %s with 400', async (query) => {
        const response = await request(t.server).get(`/api/v1/products${query}`).expect(400);
        expect(response.body).toMatchObject({ statusCode: 400, message: 'Nieprawidłowe dane' });
      });

      it('names the invalid parameter', async () => {
        const response = await request(t.server).get('/api/v1/products?pageSize=49').expect(400);
        expect(response.body).toMatchObject({ errors: [{ path: 'pageSize' }] });
      });
    });
  });

  describe('GET /products/:slug', () => {
    it('returns details with active variants, sorted images and the category path', async () => {
      const response = await request(t.server).get('/api/v1/products/etiopia-guji').expect(200);
      const body = response.body as ProductDetail;

      expect(body).toMatchObject({
        slug: 'etiopia-guji',
        name: 'Etiopia Guji',
        kind: 'COFFEE',
        description: 'Opis Etiopia Guji',
        metaTitle: null,
        metaDescription: null,
        minPrice: 4900,
        roastLevel: 'LIGHT',
        origin: { slug: 'etiopia', name: 'Etiopia' },
        category: { slug: 'przelew', name: 'Przelew' },
        breadcrumbs: [
          { slug: 'kawa', name: 'Kawa' },
          { slug: 'przelew', name: 'Przelew' },
        ],
      });
      // the inactive variant is hidden; cheapest first
      expect(body.variants.map(({ price, inStock }) => ({ price, inStock }))).toEqual([
        { price: 4900, inStock: true },
        { price: 9900, inStock: false },
      ]);
      expect(body.variants[0]).not.toHaveProperty('stock');
      expect(body.images.map((image) => image.url)).toEqual(['guji-front.webp', 'guji-back.webp']);
    });

    it('returns a root category as a one-element path', async () => {
      const response = await request(t.server).get('/api/v1/products/drip-v60').expect(200);
      expect((response.body as ProductDetail).breadcrumbs).toEqual([
        { slug: 'akcesoria', name: 'Akcesoria' },
      ]);
    });

    it.each([...HIDDEN, 'nie-ma-takiego'])('returns 404 for %s', async (slug) => {
      const response = await request(t.server).get(`/api/v1/products/${slug}`).expect(404);
      expect(response.body).toMatchObject({ message: 'Nie znaleziono produktu' });
    });
  });

  describe('GET /categories', () => {
    it('returns the tree with visible product counts including subcategories', async () => {
      const response = await request(t.server).get('/api/v1/categories').expect(200);
      const tree = response.body as CategoryNode[];
      const summary = (nodes: CategoryNode[]): unknown =>
        nodes.map((node) => ({
          slug: node.slug,
          count: node.productCount,
          children: summary(node.children),
        }));

      expect(summary(tree)).toEqual([
        { slug: 'akcesoria', count: 3, children: [] },
        {
          slug: 'kawa',
          // hidden products in przelew are not counted
          count: 4,
          children: [
            { slug: 'espresso', count: 2, children: [] },
            { slug: 'przelew', count: 2, children: [] },
          ],
        },
      ]);
      expect(tree[0]).toMatchObject({ name: 'Akcesoria', id: expect.any(String) as string });
    });
  });
});

async function seedCatalog({ prisma }: TestApp): Promise<void> {
  const kawa = await createCategory(prisma, 'kawa', 'Kawa');
  const espresso = await createCategory(prisma, 'espresso', 'Espresso', kawa);
  const przelew = await createCategory(prisma, 'przelew', 'Przelew', kawa);
  const akcesoria = await createCategory(prisma, 'akcesoria', 'Akcesoria');
  const etiopia = await createOrigin(prisma, 'etiopia', 'Etiopia');
  const kenia = await createOrigin(prisma, 'kenia', 'Kenia');
  const brazylia = await createOrigin(prisma, 'brazylia', 'Brazylia');

  const products: Omit<ProductFixture, 'createdAt'>[] = [
    {
      slug: 'etiopia-guji',
      name: 'Etiopia Guji',
      categoryId: przelew,
      originId: etiopia,
      roastLevel: 'LIGHT',
      brewMethods: ['POUR_OVER', 'AEROPRESS'],
      flavorNotes: ['jaśmin', 'brzoskwinia'],
      images: ['guji-front.webp', 'guji-back.webp'],
      variants: [{ price: 9900, stock: 0 }, { price: 4900 }, { price: 100, isActive: false }],
    },
    {
      slug: 'kenia-nyeri',
      name: 'Kenia Nyeri',
      categoryId: przelew,
      originId: kenia,
      roastLevel: 'LIGHT',
      brewMethods: ['POUR_OVER'],
      variants: [{ price: 5900, stock: 0 }],
    },
    {
      slug: 'brazylia-cerrado',
      name: 'Brazylia Cerrado',
      categoryId: espresso,
      originId: brazylia,
      roastLevel: 'DARK',
      brewMethods: ['ESPRESSO', 'MOKA'],
      variants: [{ price: 3900 }],
    },
    {
      slug: 'etiopia-sidamo',
      name: 'Etiopia Sidamo',
      categoryId: espresso,
      originId: etiopia,
      roastLevel: 'MEDIUM',
      brewMethods: ['ESPRESSO', 'AEROPRESS'],
      variants: [{ price: 5900 }],
    },
    {
      slug: 'drip-v60',
      name: 'Drip V60',
      kind: 'ACCESSORY',
      categoryId: akcesoria,
      variants: [{ price: 2900 }],
    },
    {
      slug: 'lyzka-miarka',
      name: 'Łyżka miarka',
      kind: 'ACCESSORY',
      categoryId: akcesoria,
      variants: [{ price: 1500 }],
    },
    {
      slug: 'mlynek-reczny',
      name: 'Młynek ręczny',
      kind: 'ACCESSORY',
      categoryId: akcesoria,
      variants: [{ price: 19900 }],
    },
    // Hidden ones match the broadest filters (przelew, Etiopia, LIGHT, cheap)
    {
      slug: 'rwanda-szkic',
      name: 'Etiopia Szkic',
      status: 'DRAFT',
      categoryId: przelew,
      originId: etiopia,
      roastLevel: 'LIGHT',
      brewMethods: ['POUR_OVER'],
      variants: [{ price: 1000 }],
    },
    {
      slug: 'kenia-archiwum',
      name: 'Etiopia Archiwum',
      status: 'ARCHIVED',
      categoryId: przelew,
      originId: etiopia,
      roastLevel: 'LIGHT',
      brewMethods: ['POUR_OVER'],
      variants: [{ price: 1000 }],
    },
    {
      slug: 'kolumbia-bez-wariantow',
      name: 'Etiopia Bez Wariantów',
      categoryId: przelew,
      originId: etiopia,
      roastLevel: 'LIGHT',
      brewMethods: ['POUR_OVER'],
      variants: [{ price: 1000, isActive: false }],
    },
  ];

  const start = Date.UTC(2026, 0, 1);
  for (const [index, product] of products.entries()) {
    await createProduct(prisma, {
      ...product,
      description: `Opis ${product.name}`,
      createdAt: new Date(start + index * 60_000),
    });
  }
}
