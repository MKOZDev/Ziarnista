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
} as const;

type PrismaErrorCode = (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode];

// With driver adapters (Prisma 7) meta.target is not set; the constraint name is reported here
const adapterMetaSchema = z.object({
  driverAdapterError: z.object({
    cause: z.object({ constraint: z.object({ index: z.string() }) }),
  }),
});

export function isPrismaError(
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** Name of the violated constraint or index, e.g. "categories_slug_key" */
export function violatedConstraint(error: Prisma.PrismaClientKnownRequestError): string | null {
  const meta = adapterMetaSchema.safeParse(error.meta);
  return meta.success ? meta.data.driverAdapterError.cause.constraint.index : null;
}

/** Unique violation of the given index (names follow Prisma's "<table>_<column>_key") */
export function isUniqueViolation(error: unknown, index: string): boolean {
  return (
    isPrismaError(error, PrismaErrorCode.UniqueViolation) && violatedConstraint(error) === index
  );
}
