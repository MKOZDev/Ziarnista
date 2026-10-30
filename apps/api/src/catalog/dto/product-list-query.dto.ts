import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  brewMethodSchema,
  CATALOG_DEFAULT_PAGE_SIZE,
  CATALOG_MAX_PAGE_SIZE,
  CATALOG_SEARCH_MAX_LENGTH,
  productKindSchema,
  productSortSchema,
  roastLevelSchema,
  type BrewMethod,
  type ProductKind,
  type ProductListQuery,
  type ProductSort,
  type RoastLevel,
} from '@ziarnista/shared';

// Swagger description only; validation is done by productListQuerySchema (ZodValidationPipe)
export class ProductListQueryDto implements ProductListQuery {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: CATALOG_MAX_PAGE_SIZE,
    default: CATALOG_DEFAULT_PAGE_SIZE,
  })
  pageSize: number;

  @ApiPropertyOptional({ description: 'Slug kategorii; obejmuje podkategorie', example: 'kawa' })
  category?: string;

  @ApiPropertyOptional({ enum: productKindSchema.options })
  kind?: ProductKind;

  @ApiPropertyOptional({ description: 'Slug pochodzenia', example: 'etiopia' })
  origin?: string;

  @ApiPropertyOptional({ enum: roastLevelSchema.options })
  roastLevel?: RoastLevel;

  @ApiPropertyOptional({
    enum: brewMethodSchema.options,
    isArray: true,
    description:
      'Można podać kilka (?brewMethod=ESPRESSO&brewMethod=MOKA); wystarczy zgodność z jedną',
  })
  brewMethod?: BrewMethod[];

  @ApiPropertyOptional({ minimum: 0, description: 'Grosze, porównywane z minPrice' })
  priceMin?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Grosze, porównywane z minPrice' })
  priceMax?: number;

  @ApiPropertyOptional({
    maxLength: CATALOG_SEARCH_MAX_LENGTH,
    description: 'Fragment nazwy, bez rozróżniania wielkości liter',
  })
  q?: string;

  @ApiPropertyOptional({ enum: productSortSchema.options, default: 'newest' })
  sort: ProductSort;
}
