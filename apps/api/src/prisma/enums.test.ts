import {
  brewMethodSchema,
  productKindSchema,
  productStatusSchema,
  roastLevelSchema,
  roleSchema,
} from '@ziarnista/shared';
import { describe, expect, it } from 'vitest';
import {
  BrewMethod,
  ProductKind,
  ProductStatus,
  RoastLevel,
  Role,
} from '../generated/prisma/enums';

// Zod enums in packages/shared are hand-written mirrors of the Prisma enums; this catches drift
describe('shared Zod enums match Prisma enums', () => {
  it.each([
    { name: 'ProductKind', prisma: ProductKind, zod: productKindSchema },
    { name: 'ProductStatus', prisma: ProductStatus, zod: productStatusSchema },
    { name: 'RoastLevel', prisma: RoastLevel, zod: roastLevelSchema },
    { name: 'BrewMethod', prisma: BrewMethod, zod: brewMethodSchema },
    { name: 'Role', prisma: Role, zod: roleSchema },
  ])('$name', ({ prisma, zod }) => {
    expect([...zod.options].sort()).toEqual(Object.values(prisma).sort());
  });
});
