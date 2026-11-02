import { describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client';
import {
  isCheckViolation,
  isForeignKeyViolation,
  isPrismaError,
  isUniqueViolation,
  PrismaErrorCode,
  violatedConstraint,
} from './prisma-errors';

// Shape of the meta reported by @prisma/adapter-pg (checked against a real database)
function uniqueViolation(index: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: {
      modelName: 'Category',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          originalCode: '23505',
          kind: 'UniqueConstraintViolation',
          constraint: { index },
          table: 'categories',
        },
      },
    },
  });
}

describe('prisma errors', () => {
  it('reads the violated index from the driver adapter meta', () => {
    expect(violatedConstraint(uniqueViolation('categories_slug_key'))).toBe('categories_slug_key');
  });

  it('returns null when the meta has another shape', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
      meta: { modelName: 'Category' },
    });

    expect(violatedConstraint(error)).toBeNull();
  });

  it('matches a unique violation only on the given index', () => {
    const error = uniqueViolation('origins_name_key');

    expect(isUniqueViolation(error, 'origins_name_key')).toBe(true);
    expect(isUniqueViolation(error, 'origins_slug_key')).toBe(false);
    expect(isUniqueViolation(new Error('boom'), 'origins_name_key')).toBe(false);
  });

  it('checks the error code', () => {
    expect(isPrismaError(uniqueViolation('x'), PrismaErrorCode.UniqueViolation)).toBe(true);
    expect(isPrismaError(uniqueViolation('x'), PrismaErrorCode.RecordNotFound)).toBe(false);
  });
});

describe('constraint names outside cause.constraint', () => {
  // A CHECK violation has no constraint field; the name is only in the message (P2039)
  const checkViolation = new Prisma.PrismaClientKnownRequestError('Database error', {
    code: 'P2039',
    clientVersion: 'test',
    meta: {
      driverAdapterError: {
        cause: {
          originalCode: '23514',
          originalMessage:
            'new row for relation "products" violates check constraint "products_coffee_fields_check"',
        },
      },
    },
  });

  it('reads the CHECK constraint name from the message', () => {
    expect(violatedConstraint(checkViolation)).toBe('products_coffee_fields_check');
    expect(isCheckViolation(checkViolation, 'products_coffee_fields_check')).toBe(true);
    expect(isCheckViolation(checkViolation, 'products_min_price_check')).toBe(false);
  });

  it('matches a foreign key violation by constraint', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Foreign key', {
      code: 'P2003',
      clientVersion: 'test',
      meta: {
        driverAdapterError: { cause: { constraint: { index: 'products_origin_id_fkey' } } },
      },
    });

    expect(isForeignKeyViolation(error, 'products_origin_id_fkey')).toBe(true);
    expect(isForeignKeyViolation(error, 'products_category_id_fkey')).toBe(false);
    expect(isForeignKeyViolation(checkViolation, 'products_origin_id_fkey')).toBe(false);
  });
});
