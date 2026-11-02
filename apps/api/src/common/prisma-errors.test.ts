import { describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client';
import {
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
