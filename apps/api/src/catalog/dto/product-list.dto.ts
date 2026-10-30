import { ApiProperty } from '@nestjs/swagger';
import {
  brewMethodSchema,
  productKindSchema,
  roastLevelSchema,
  type BrewMethod,
  type ProductFacets,
  type ProductImage,
  type ProductKind,
  type ProductListItem,
  type ProductListResponse,
  type RoastLevel,
} from '@ziarnista/shared';
import { NamedRefDto } from './named-ref.dto';

export class ProductImageDto implements ProductImage {
  @ApiProperty({ example: 'https://cdn.example.com/products/etiopia-guji-hambela/1.webp' })
  url: string;

  @ApiProperty({ example: 'Opakowanie kawy Etiopia Guji Hambela' })
  alt: string;
}

export class ProductListItemDto implements ProductListItem {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'etiopia-guji-hambela' })
  slug: string;

  @ApiProperty({ example: 'Etiopia Guji Hambela' })
  name: string;

  @ApiProperty({ enum: productKindSchema.options })
  kind: ProductKind;

  @ApiProperty({ description: 'Najniższa cena aktywnego wariantu, grosze', example: 6900 })
  minPrice: number;

  @ApiProperty({ enum: roastLevelSchema.options, nullable: true })
  roastLevel: RoastLevel | null;

  @ApiProperty({ type: () => NamedRefDto, nullable: true })
  origin: NamedRefDto | null;

  @ApiProperty({ type: [String], example: ['jaśmin', 'brzoskwinia'] })
  flavorNotes: string[];

  @ApiProperty({ enum: brewMethodSchema.options, isArray: true })
  brewMethods: BrewMethod[];

  @ApiProperty({ type: () => ProductImageDto, nullable: true, description: 'Pierwsze zdjęcie' })
  image: ProductImageDto | null;

  @ApiProperty({ description: 'Któryś aktywny wariant jest na stanie' })
  inStock: boolean;
}

export class OriginFacetDto extends NamedRefDto {
  @ApiProperty({ example: 4 })
  count: number;
}

export class RoastLevelFacetDto {
  @ApiProperty({ enum: roastLevelSchema.options })
  value: RoastLevel;

  @ApiProperty({ example: 4 })
  count: number;
}

export class BrewMethodFacetDto {
  @ApiProperty({ enum: brewMethodSchema.options })
  value: BrewMethod;

  @ApiProperty({ example: 4 })
  count: number;
}

export class ProductFacetsDto implements ProductFacets {
  @ApiProperty({ type: [OriginFacetDto] })
  origin: OriginFacetDto[];

  @ApiProperty({ type: [RoastLevelFacetDto] })
  roastLevel: RoastLevelFacetDto[];

  @ApiProperty({ type: [BrewMethodFacetDto] })
  brewMethod: BrewMethodFacetDto[];
}

export class ProductListResponseDto implements ProductListResponse {
  @ApiProperty({ type: [ProductListItemDto] })
  items: ProductListItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 24 })
  pageSize: number;

  @ApiProperty({ example: 18 })
  total: number;

  @ApiProperty({ example: 1, description: '0, gdy brak wyników' })
  totalPages: number;

  @ApiProperty({
    type: ProductFacetsDto,
    description:
      'Liczby produktów dla wartości filtrów. Każda faseta pomija własny filtr, ' +
      'a uwzględnia pozostałe. Tylko wartości z count > 0.',
  })
  facets: ProductFacetsDto;
}
