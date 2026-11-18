import { z } from 'zod';

// Error body of the API: { statusCode, message, error? } from NestJS,
// plus errors[] on validation failures (Zod and business rules checked in services)
export const apiErrorBodySchema = z.object({
  message: z.string(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
