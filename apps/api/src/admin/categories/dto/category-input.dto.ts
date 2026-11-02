import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DICTIONARY_NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@ziarnista/shared';

// Swagger description only; validation is done by createCategorySchema / updateCategorySchema

export class CreateCategoryDto implements CreateCategoryInput {
  @ApiProperty({ minLength: 1, maxLength: DICTIONARY_NAME_MAX_LENGTH, example: 'Drippery' })
  name: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    example: 'drippery',
    description:
      'Domyślnie generowany z nazwy (przy kolizji sufiks -2, -3…); podany ręcznie i zajęty = 409',
  })
  slug?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    default: null,
    description: 'Kategoria nadrzędna; null = kategoria główna',
  })
  parentId: string | null;
}

export class UpdateCategoryDto implements UpdateCategoryInput {
  @ApiPropertyOptional({ minLength: 1, maxLength: DICTIONARY_NAME_MAX_LENGTH })
  name?: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    description: 'Zmiana nazwy nie zmienia slugu; nowy slug trzeba podać jawnie',
  })
  slug?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Przeniesienie w drzewie; null = kategoria główna',
  })
  parentId?: string | null;
}
