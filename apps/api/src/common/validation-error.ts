import { BadRequestException } from '@nestjs/common';
import type { FieldIssue } from '@ziarnista/shared';

export const VALIDATION_ERROR_MESSAGE = 'Nieprawidłowe dane';

/**
 * 400 in the same shape as Zod validation errors ({ message, errors: [{ path, message }] }),
 * so the panel shows business-rule errors (checked in services) next to the right field too.
 */
export function validationError(
  errors: FieldIssue[],
  message = VALIDATION_ERROR_MESSAGE,
): BadRequestException {
  return new BadRequestException({ statusCode: 400, message, errors });
}
