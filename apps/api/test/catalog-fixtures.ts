import type {
  BrewMethod,
  ProductKind,
  ProductStatus,
  RoastLevel,
} from '../src/generated/prisma/enums';
import type { PrismaService } from '../src/prisma/prisma.service';
import { computeMinPrice } from '../src/products/min-price';

// Minimal builders for catalog tests; every test file describes its own data instead of
// relying on the seed, so a seed change cannot break the tests.

export async function createCategory(
  prisma: PrismaService,
  slug: string,
  name: string,
  parentId: string | null = null,
): Promise<string> {
  const category = await prisma.category.create({ data: { slug, name, parentId } });
  return category.id;
}

export async function createOrigin(
  prisma: PrismaService,
  slug: string,
  name: string,
): Promise<string> {
  const origin = await prisma.origin.create({ data: { slug, name } });
  return origin.id;
}

export type VariantFixture = { price: number; stock?: number; isActive?: boolean };

export type ProductFixture = {
  slug: string;
  name: string;
  categoryId: string;
  variants: VariantFixture[];
  kind?: ProductKind;
  status?: ProductStatus;
  originId?: string | null;
  roastLevel?: RoastLevel | null;
  brewMethods?: BrewMethod[];
  flavorNotes?: string[];
  description?: string;
  /** Image urls; created with positions in reverse order, so tests see them sorted */
  images?: string[];
  createdAt?: Date;
};

export async function createProduct(
  prisma: PrismaService,
  product: ProductFixture,
): Promise<string> {
  const variants = product.variants.map((variant, index) => ({
    sku: `${product.slug}-${index}`,
    label: `wariant ${index}`,
    price: variant.price,
    stock: variant.stock ?? 10,
    isActive: variant.isActive ?? true,
  }));
  const images = (product.images ?? [])
    .map((url, position) => ({ url, alt: `${product.name} ${position}`, position }))
    .reverse();
  const kind = product.kind ?? 'COFFEE';

  const created = await prisma.product.create({
    data: {
      slug: product.slug,
      name: product.name,
      kind,
      status: product.status ?? 'ACTIVE',
      categoryId: product.categoryId,
      originId: product.originId ?? null,
      roastLevel: product.roastLevel ?? (kind === 'COFFEE' ? 'MEDIUM' : null),
      brewMethods: product.brewMethods ?? [],
      flavorNotes: product.flavorNotes ?? [],
      description: product.description,
      minPrice: computeMinPrice(variants),
      createdAt: product.createdAt,
      variants: { create: variants },
      images: { create: images },
    },
  });
  return created.id;
}
