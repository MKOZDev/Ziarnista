import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { validationError } from './validation-error';

/** Validates and transforms a request part with a Zod schema from @ziarnista/shared. */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown, metadata?: ArgumentMetadata): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      // A named argument (@Param('id'), @Body('sku')) is validated on its own, so its issues
      // have an empty path; the argument name puts them on the right field.
      // @Body() / @Query() without a name pass no data and keep the schema's paths.
      const prefix = metadata?.data === undefined ? [] : [metadata.data];
      throw validationError(
        result.error.issues.map((issue) => ({
          path: [...prefix, ...issue.path.map(String)].join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
