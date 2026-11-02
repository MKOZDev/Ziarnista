import { z } from 'zod';
import { Prisma } from '../generated/prisma/client';

/** Prisma error codes the services translate into HTTP responses */
export const PrismaErrorCode = {
  /** Unique constraint (23505) */
  UniqueViolation: 'P2002',
  /** Foreign key: missing referenced row (23503) or RESTRICT on delete (23001) */
  ForeignKeyViolation: 'P2003',
  /** update/delete found no row */
  RecordNotFound: 'P2025',
  /** A database error without its own Prisma code, e.g. a CHECK constraint (23514) */
  DatabaseError: 'P2039',
} as const;

type PrismaErrorCode = (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode];

// With driver adapters (Prisma 7) meta.target is not set. Unique and foreign key errors
// name the constraint in cause.constraint.index; other errors only in the message.
const adapterMetaSchema = z.object({
  driverAdapterError: z.object({
    cause: z.object({
      originalCode: z.string().optional(),
      originalMessage: z.string().optional(),
      constraint: z.object({ index: z.string() }).optional(),
    }),
  }),
});

const CONSTRAINT_IN_MESSAGE = /constraint "([^"]+)"/;
const CHECK_VIOLATION_SQLSTATE = '23514';

export function isPrismaError(
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** Name of the violated constraint or index, e.g. "categories_slug_key" */
export function violatedConstraint(error: Prisma.PrismaClientKnownRequestError): string | null {
  const meta = adapterMetaSchema.safeParse(error.meta);
  if (!meta.success) {
    return null;
  }
  const cause = meta.data.driverAdapterError.cause;
  return (
    cause.constraint?.index ?? cause.originalMessage?.match(CONSTRAINT_IN_MESSAGE)?.[1] ?? null
  );
}

/** CHECK constraint violation, e.g. "products_coffee_fields_check" */
export function isCheckViolation(error: unknown, constraint: string): boolean {
  if (!isPrismaError(error, PrismaErrorCode.DatabaseError)) {
    return false;
  }
  const meta = adapterMetaSchema.safeParse(error.meta);
  return (
    meta.success &&
    meta.data.driverAdapterError.cause.originalCode === CHECK_VIOLATION_SQLSTATE &&
    violatedConstraint(error) === constraint
  );
}

/** Foreign key violation of the given constraint, e.g. "products_category_id_fkey" */
export function isForeignKeyViolation(error: unknown, constraint: string): boolean {
  return (
    isPrismaError(error, PrismaErrorCode.ForeignKeyViolation) &&
    violatedConstraint(error) === constraint
  );
}

/** Unique violation of the given index (names follow Prisma's "<table>_<column>_key") */
export function isUniqueViolation(error: unknown, index: string): boolean {
  return (
    isPrismaError(error, PrismaErrorCode.UniqueViolation) && violatedConstraint(error) === index
  );
}
