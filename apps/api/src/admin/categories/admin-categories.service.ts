import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from '@ziarnista/shared';
import { CategoryTree } from '../../catalog/category-tree';
import { countPl } from '../../common/plural-pl';
import { isPrismaError, isUniqueViolation, PrismaErrorCode } from '../../common/prisma-errors';
import { createWithUniqueSlug } from '../../common/unique-slug';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const CATEGORY_NOT_FOUND_MESSAGE = 'Nie znaleziono kategorii';
export const PARENT_NOT_FOUND_MESSAGE = 'Kategoria nadrzędna nie istnieje';
export const CATEGORY_CYCLE_MESSAGE =
  'Kategoria nie może być podkategorią samej siebie ani żadnej ze swoich podkategorii';
export const CATEGORY_SLUG_TAKEN_MESSAGE = 'Kategoria o tym slugu już istnieje';

const SLUG_INDEX = 'categories_slug_key';

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  _count: { select: { products: true, children: true } },
} satisfies Prisma.CategorySelect;

type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

function toAdminCategory({ _count, ...category }: CategoryRow): AdminCategory {
  return { ...category, productCount: _count.products, childCount: _count.children };
}

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminCategory[]> {
    const rows = await this.prisma.category.findMany({
      select: categorySelect,
      orderBy: { name: 'asc' },
    });
    return rows.map(toAdminCategory);
  }

  async create(input: CreateCategoryInput): Promise<AdminCategory> {
    try {
      const row = await createWithUniqueSlug({
        name: input.name,
        slug: input.slug,
        slugIndex: SLUG_INDEX,
        findTaken: (base) => this.findTakenSlugs(base),
        create: (slug) =>
          this.prisma.category.create({
            data: { name: input.name, slug, parentId: input.parentId },
            select: categorySelect,
          }),
      });
      return toAdminCategory(row);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  async update(id: string, input: UpdateCategoryInput): Promise<AdminCategory> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (input.parentId) {
          await assertNoCycle(tx, id, input.parentId);
        }
        return tx.category.update({ where: { id }, data: input, select: categorySelect });
      });
      return toAdminCategory(row);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  /**
   * Only an empty category can be deleted. Products of any status count: archived ones still
   * reference it, and moving them is the admin's decision. The RESTRICT foreign keys enforce
   * the same rule against concurrent changes; the check before gives a readable message.
   */
  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { _count: { select: { products: true, children: true } } },
    });
    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
    }
    const { products, children } = category._count;
    if (products > 0 || children > 0) {
      const blockers = [
        products > 0 ? countPl(products, ['produkt', 'produkty', 'produktów']) : null,
        children > 0 ? countPl(children, ['podkategorię', 'podkategorie', 'podkategorii']) : null,
      ].filter((blocker) => blocker !== null);
      throw new ConflictException(
        `Nie można usunąć kategorii, która ma ${blockers.join(' i ')}. Najpierw je przenieś.`,
      );
    }
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.ForeignKeyViolation)) {
        // A product or subcategory was added after the check above
        throw new ConflictException('Kategoria nie jest już pusta, odśwież listę');
      }
      throw translateWriteError(error);
    }
  }

  private async findTakenSlugs(base: string): Promise<string[]> {
    const rows = await this.prisma.category.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }
}

/**
 * The database does not prevent cycles in parent_id, so a move is checked against the whole
 * tree. Two concurrent moves (A under B, B under A) would each pass the check alone; the
 * transaction-scoped advisory lock makes tree moves run one at a time. Moves are rare, so
 * serializing them costs nothing.
 */
async function assertNoCycle(
  tx: Prisma.TransactionClient,
  id: string,
  parentId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('category_tree'))`;
  const tree = new CategoryTree(
    await tx.category.findMany({ select: { id: true, parentId: true, slug: true, name: true } }),
  );
  // descendantIds includes the category itself, so this also rejects parentId === id
  const descendants = tree.descendantIds(id);
  if (descendants.length === 0) {
    throw new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
  }
  if (descendants.includes(parentId)) {
    throw new BadRequestException(CATEGORY_CYCLE_MESSAGE);
  }
}

function translateWriteError(error: unknown): unknown {
  if (isUniqueViolation(error, SLUG_INDEX)) {
    return new ConflictException(CATEGORY_SLUG_TAKEN_MESSAGE);
  }
  if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
    return new NotFoundException(CATEGORY_NOT_FOUND_MESSAGE);
  }
  // On insert/update the only foreign key is parent_id
  if (isPrismaError(error, PrismaErrorCode.ForeignKeyViolation)) {
    return new BadRequestException(PARENT_NOT_FOUND_MESSAGE);
  }
  return error;
}
