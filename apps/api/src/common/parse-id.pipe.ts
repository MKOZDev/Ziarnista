import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

const idParamSchema = z.uuid('Nieprawidłowy identyfikator');

/** Route :id params; a malformed id is a 400 instead of a database error */
export class ParseIdPipe extends ZodValidationPipe<typeof idParamSchema> {
  constructor() {
    super(idParamSchema);
  }
}
