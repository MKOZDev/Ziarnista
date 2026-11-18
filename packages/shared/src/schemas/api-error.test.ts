import { describe, expect, it } from 'vitest';
import { apiErrorBodySchema } from './api-error';

describe('apiErrorBodySchema', () => {
  it('accepts a plain NestJS error and drops the fields the clients do not use', () => {
    const body = { statusCode: 401, message: 'Sesja wygasła', error: 'Unauthorized' };

    expect(apiErrorBodySchema.parse(body)).toEqual({ message: 'Sesja wygasła' });
  });

  it('keeps the field errors of a validation failure', () => {
    const errors = [{ path: 'email', message: 'Nieprawidłowy adres email' }];

    expect(apiErrorBodySchema.parse({ message: 'Nieprawidłowe dane', errors }).errors).toEqual(
      errors,
    );
  });

  it('rejects a body without a message', () => {
    expect(apiErrorBodySchema.safeParse({ statusCode: 500 }).success).toBe(false);
  });
});
