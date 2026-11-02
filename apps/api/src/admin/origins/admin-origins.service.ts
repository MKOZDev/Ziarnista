import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminOrigin, CreateOriginInput, UpdateOriginInput } from '@ziarnista/shared';
import { countPl } from '../../common/plural-pl';
import { isPrismaError, isUniqueViolation, PrismaErrorCode } from '../../common/prisma-errors';
import { createWithUniqueSlug } from '../../common/unique-slug';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const ORIGIN_NOT_FOUND_MESSAGE = 'Nie znaleziono pochodzenia';
export const ORIGIN_NAME_TAKEN_MESSAGE = 'Pochodzenie o tej nazwie już istnieje';
export const ORIGIN_SLUG_TAKEN_MESSAGE = 'Pochodzenie o tym slugu już istnieje';

const SLUG_INDEX = 'origins_slug_key';
const NAME_INDEX = 'origins_name_key';

const originSelect = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { products: true } },
} satisfies Prisma.OriginSelect;

type OriginRow = Prisma.OriginGetPayload<{ select: typeof originSelect }>;

function toAdminOrigin({ _count, ...origin }: OriginRow): AdminOrigin {
  return { ...origin, productCount: _count.products };
}

@Injectable()
export class AdminOriginsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminOrigin[]> {
    const rows = await this.prisma.origin.findMany({
      select: originSelect,
      orderBy: { name: 'asc' },
    });
    return rows.map(toAdminOrigin);
  }

  async create(input: CreateOriginInput): Promise<AdminOrigin> {
    await this.assertNameFree(input.name);
    try {
      const row = await createWithUniqueSlug({
        name: input.name,
        slug: input.slug,
        slugIndex: SLUG_INDEX,
        findTaken: (base) => this.findTakenSlugs(base),
        create: (slug) =>
          this.prisma.origin.create({ data: { name: input.name, slug }, select: originSelect }),
      });
      return toAdminOrigin(row);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  async update(id: string, input: UpdateOriginInput): Promise<AdminOrigin> {
    if (input.name !== undefined) {
      await this.assertNameFree(input.name, id);
    }
    try {
      const row = await this.prisma.origin.update({
        where: { id },
        data: input,
        select: originSelect,
      });
      return toAdminOrigin(row);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  /** Blocked while any product (of any status) uses the origin; RESTRICT backs this up */
  async remove(id: string): Promise<void> {
    const origin = await this.prisma.origin.findUnique({ where: { id }, select: originSelect });
    if (!origin) {
      throw new NotFoundException(ORIGIN_NOT_FOUND_MESSAGE);
    }
    const products = origin._count.products;
    if (products > 0) {
      throw new ConflictException(
        `Nie można usunąć pochodzenia przypisanego do ${countPl(products, ['produktu', 'produktów', 'produktów'])}`,
      );
    }
    try {
      await this.prisma.origin.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.ForeignKeyViolation)) {
        throw new ConflictException('Pochodzenie jest już używane, odśwież listę');
      }
      throw translateWriteError(error);
    }
  }

  /**
   * The unique index is case-sensitive; "etiopia" next to "Etiopia" would be a duplicate
   * for the admin, so the check ignores case. The index still guards exact duplicates
   * created concurrently.
   */
  private async assertNameFree(name: string, exceptId?: string): Promise<void> {
    const existing = await this.prisma.origin.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, id: { not: exceptId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(ORIGIN_NAME_TAKEN_MESSAGE);
    }
  }

  private async findTakenSlugs(base: string): Promise<string[]> {
    const rows = await this.prisma.origin.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }
}

function translateWriteError(error: unknown): unknown {
  if (isUniqueViolation(error, NAME_INDEX)) {
    return new ConflictException(ORIGIN_NAME_TAKEN_MESSAGE);
  }
  if (isUniqueViolation(error, SLUG_INDEX)) {
    return new ConflictException(ORIGIN_SLUG_TAKEN_MESSAGE);
  }
  if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
    return new NotFoundException(ORIGIN_NOT_FOUND_MESSAGE);
  }
  return error;
}
