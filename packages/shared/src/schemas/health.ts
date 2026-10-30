import { z } from 'zod';

// Body of GET /api/v1/health, returned with 200 (ok) and 503 (database down)
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.enum(['up', 'down']),
  uptime: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
