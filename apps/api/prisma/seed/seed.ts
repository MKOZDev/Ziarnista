import { PrismaPg } from '@prisma/adapter-pg';
import { productAttributesSchema } from '@ziarnista/shared';
import { hashPassword } from '../../src/auth/password';
import { PrismaClient, type Role } from '../../src/generated/prisma/client';
import { computeMinPrice } from '../../src/products/min-price';
import { categories, origins, products, type ProductSeed } from './data';
import { loadSeedEnv } from './env';

// Idempotent: everything is upserted by a natural key (slug, sku, email), so the seed can be
// re-run at any time. Catalog rows are overwritten with seed data; users are only created,
// never updated (a re-run must not reset a password changed in the app).

async function seedCategories(prisma: PrismaClient): Promise<Map<string, string>> {
  const idsBySlug = new Map<string, string>();
  for (const { slug, name, parentSlug } of categories) {
    const parentId = parentSlug === null ? null : requireId(idsBySlug, parentSlug, 'category');
    const category = await prisma.category.upsert({
      where: { slug },
      create: { slug, name, parentId },
      update: { name, parentId },
    });
    idsBySlug.set(slug, category.id);
  }
  return idsBySlug;
}

async function seedOrigins(prisma: PrismaClient): Promise<Map<string, string>> {
  const idsBySlug = new Map<string, string>();
  for (const { slug, name } of origins) {
    const origin = await prisma.origin.upsert({
      where: { slug },
      create: { slug, name },
      update: { name },
    });
    idsBySlug.set(slug, origin.id);
  }
  return idsBySlug;
}

async function seedProduct(
  prisma: PrismaClient,
  product: ProductSeed,
  categoryIds: Map<string, string>,
  originIds: Map<string, string>,
): Promise<void> {
  // Same rule as the products_coffee_fields_check constraint, but with a readable error
  const attributes = productAttributesSchema.parse({
    kind: product.kind,
    originId:
      product.originSlug === null ? null : requireId(originIds, product.originSlug, 'origin'),
    roastLevel: product.roastLevel,
    flavorNotes: product.flavorNotes,
    brewMethods: product.brewMethods,
  });

  const data = {
    ...attributes,
    name: product.name,
    description: product.description,
    status: product.status,
    categoryId: requireId(categoryIds, product.categorySlug, 'category'),
    minPrice: computeMinPrice(product.variants),
  };

  // One transaction per product: minPrice never disagrees with the variants
  await prisma.$transaction(async (tx) => {
    const { id: productId } = await tx.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...data },
      update: data,
    });
    for (const { sku, ...variant } of product.variants) {
      await tx.productVariant.upsert({
        where: { sku },
        create: { sku, productId, ...variant },
        update: { productId, ...variant },
      });
    }
  });
}

async function seedUser(
  prisma: PrismaClient,
  user: { email: string; password: string; name: string; role: Role },
): Promise<void> {
  await prisma.user.upsert({
    where: { email: user.email },
    create: {
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: await hashPassword(user.password),
    },
    update: {},
  });
}

function requireId(idsBySlug: Map<string, string>, slug: string, kind: string): string {
  const id = idsBySlug.get(slug);
  if (id === undefined) {
    throw new Error(`Seed data references unknown ${kind} "${slug}"`);
  }
  return id;
}

async function main(): Promise<void> {
  const env = loadSeedEnv();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

  try {
    const categoryIds = await seedCategories(prisma);
    const originIds = await seedOrigins(prisma);
    for (const product of products) {
      await seedProduct(prisma, product, categoryIds, originIds);
    }
    await seedUser(prisma, {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      name: 'Administrator',
      role: 'ADMIN',
    });
    await seedUser(prisma, {
      email: env.SEED_CUSTOMER_EMAIL,
      password: env.SEED_CUSTOMER_PASSWORD,
      name: 'Klient Testowy',
      role: 'CUSTOMER',
    });

    const variantCount = products.reduce((sum, product) => sum + product.variants.length, 0);
    console.log(
      `Seed done: ${categories.length} categories, ${origins.length} origins, ` +
        `${products.length} products, ${variantCount} variants, 2 users.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
