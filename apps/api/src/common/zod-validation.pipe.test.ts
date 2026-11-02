import { BadRequestException, type ArgumentMetadata } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ParseIdPipe } from './parse-id.pipe';
import { ZodValidationPipe } from './zod-validation.pipe';

function errorsOf(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { errors: unknown }).errors;
    }
    throw error;
  }
  throw new Error('expected a BadRequestException');
}

const param = (data: string): ArgumentMetadata => ({ type: 'param', data });
const body: ArgumentMetadata = { type: 'body', data: undefined };

describe('ZodValidationPipe', () => {
  it('returns the parsed value', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().trim() }));

    expect(pipe.transform({ name: ' Kawa ' }, body)).toEqual({ name: 'Kawa' });
  });

  it('keeps the schema paths for a whole body', () => {
    const pipe = new ZodValidationPipe(
      z.object({ variants: z.array(z.object({ sku: z.string() })) }),
    );

    expect(errorsOf(() => pipe.transform({ variants: [{ sku: 1 }] }, body))).toEqual([
      { path: 'variants.0.sku', message: expect.any(String) as string },
    ]);
  });

  it('puts the issue of a named argument on the argument name', () => {
    expect(errorsOf(() => new ParseIdPipe().transform('nie-uuid', param('variantId')))).toEqual([
      { path: 'variantId', message: 'Nieprawidłowy identyfikator' },
    ]);
  });

  it('prefixes nested paths with the argument name', () => {
    const pipe = new ZodValidationPipe(z.object({ sku: z.string().min(1) }));

    expect(errorsOf(() => pipe.transform({ sku: '' }, { type: 'body', data: 'variant' }))).toEqual([
      { path: 'variant.sku', message: expect.any(String) as string },
    ]);
  });
});
