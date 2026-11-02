import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DICTIONARY_NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  type CreateOriginInput,
  type UpdateOriginInput,
} from '@ziarnista/shared';

// Swagger description only; validation is done by createOriginSchema / updateOriginSchema

export class CreateOriginDto implements CreateOriginInput {
  @ApiProperty({
    minLength: 1,
    maxLength: DICTIONARY_NAME_MAX_LENGTH,
    example: 'Kolumbia',
    description: 'Unikalna bez rozróżniania wielkości liter',
  })
  name: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    example: 'kolumbia',
    description: 'Domyślnie generowany z nazwy; podany ręcznie i zajęty = 409',
  })
  slug?: string;
}

export class UpdateOriginDto implements UpdateOriginInput {
  @ApiPropertyOptional({ minLength: 1, maxLength: DICTIONARY_NAME_MAX_LENGTH })
  name?: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    description: 'Zmiana nazwy nie zmienia slugu; nowy slug trzeba podać jawnie',
  })
  slug?: string;
}
