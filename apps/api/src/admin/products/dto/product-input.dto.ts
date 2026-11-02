import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ADMIN_SEARCH_MAX_LENGTH,
  adminProductSortSchema,
  brewMethodSchema,
  META_DESCRIPTION_MAX_LENGTH,
  META_TITLE_MAX_LENGTH,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_MAX_VARIANTS,
  PRODUCT_NAME_MAX_LENGTH,
  productKindSchema,
  productStatusSchema,
  roastLevelSchema,
  SKU_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  VARIANT_LABEL_MAX_LENGTH,
  type AdminProductListQuery,
  type AdminProductSort,
  type BrewMethod,
  type CreateProductInput,
  type CreateVariantInput,
  type ProductKind,
  type ProductStatus,
  type RoastLevel,
  type UpdateProductInput,
  type UpdateVariantInput,
} from '@ziarnista/shared';

// Swagger description only; validation is done by the Zod schemas in @ziarnista/shared

export class CreateVariantDto implements CreateVariantInput {
  @ApiProperty({
    maxLength: SKU_MAX_LENGTH,
    example: 'ETH-GUJI-250-Z',
    description: 'Litery, cyfry i myślniki; zapisywane wielkimi literami; unikalne',
  })
  sku: string;

  @ApiProperty({ maxLength: VARIANT_LABEL_MAX_LENGTH, example: '250 g / ziarno' })
  label: string;

  @ApiProperty({ minimum: 1, description: 'Grosze', example: 4900 })
  price: number;

  @ApiProperty({ minimum: 0, example: 20 })
  stock: number;

  @ApiPropertyOptional({ default: true })
  isActive: boolean;
}

export class UpdateVariantDto implements UpdateVariantInput {
  @ApiPropertyOptional({ maxLength: SKU_MAX_LENGTH })
  sku?: string;

  @ApiPropertyOptional({ maxLength: VARIANT_LABEL_MAX_LENGTH })
  label?: string;

  @ApiPropertyOptional({ minimum: 1, description: 'Grosze' })
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  stock?: number;

  @ApiPropertyOptional({
    description:
      'false wyłącza wariant; ostatniego aktywnego wariantu produktu ACTIVE nie można wyłączyć',
  })
  isActive?: boolean;
}

export class CreateProductDto implements CreateProductInput {
  @ApiProperty({ enum: productKindSchema.options })
  kind: ProductKind;

  @ApiProperty({ maxLength: PRODUCT_NAME_MAX_LENGTH, example: 'Etiopia Guji' })
  name: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    description: 'Domyślnie z nazwy (przy kolizji sufiks -2, -3…); podany ręcznie i zajęty = 409',
  })
  slug?: string;

  @ApiPropertyOptional({ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH, default: '' })
  description: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: META_TITLE_MAX_LENGTH,
    description: 'Pusty tekst zapisywany jako null',
  })
  metaTitle: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: META_DESCRIPTION_MAX_LENGTH })
  metaDescription: string | null;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Wymagane dla COFFEE, zabronione dla ACCESSORY',
  })
  originId: string | null;

  @ApiPropertyOptional({
    enum: roastLevelSchema.options,
    nullable: true,
    description: 'Wymagany dla COFFEE, zabroniony dla ACCESSORY',
  })
  roastLevel: RoastLevel | null;

  @ApiPropertyOptional({ type: [String], description: 'Zapisywane małymi literami, bez powtórzeń' })
  flavorNotes: string[];

  @ApiPropertyOptional({ enum: brewMethodSchema.options, isArray: true })
  brewMethods: BrewMethod[];

  @ApiProperty({
    type: [CreateVariantDto],
    minItems: 1,
    maxItems: PRODUCT_MAX_VARIANTS,
    description: 'Zapisywane w jednej transakcji z produktem',
  })
  variants: CreateVariantDto[];
}

export class UpdateProductDto implements UpdateProductInput {
  @ApiPropertyOptional({ enum: productKindSchema.options })
  kind?: ProductKind;

  @ApiPropertyOptional({ maxLength: PRODUCT_NAME_MAX_LENGTH })
  name?: string;

  @ApiPropertyOptional({
    maxLength: SLUG_MAX_LENGTH,
    description: 'Zmiana nazwy nie zmienia slugu; nowy slug trzeba podać jawnie',
  })
  slug?: string;

  @ApiPropertyOptional({ maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH })
  description?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: META_TITLE_MAX_LENGTH })
  metaTitle?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: META_DESCRIPTION_MAX_LENGTH })
  metaDescription?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  categoryId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  originId?: string | null;

  @ApiPropertyOptional({ enum: roastLevelSchema.options, nullable: true })
  roastLevel?: RoastLevel | null;

  @ApiPropertyOptional({ type: [String] })
  flavorNotes?: string[];

  @ApiPropertyOptional({ enum: brewMethodSchema.options, isArray: true })
  brewMethods?: BrewMethod[];

  @ApiPropertyOptional({
    enum: productStatusSchema.options,
    description:
      'ACTIVE wymaga aktywnego wariantu i zdjęcia; ARCHIVED → DRAFT przywraca produkt z archiwum',
  })
  status?: ProductStatus;
}

export class AdminProductListQueryDto implements AdminProductListQuery {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  page: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGINATION_MAX_PAGE_SIZE,
    default: PAGINATION_DEFAULT_PAGE_SIZE,
  })
  pageSize: number;

  @ApiPropertyOptional({
    maxLength: ADMIN_SEARCH_MAX_LENGTH,
    description: 'Fragment nazwy, slugu lub SKU wariantu; bez rozróżniania wielkości liter',
  })
  q?: string;

  @ApiPropertyOptional({ enum: productStatusSchema.options, description: 'Domyślnie wszystkie' })
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: productKindSchema.options })
  kind?: ProductKind;

  @ApiPropertyOptional({ format: 'uuid', description: 'Obejmuje podkategorie' })
  categoryId?: string;

  @ApiPropertyOptional({
    enum: adminProductSortSchema.options,
    default: 'updated',
    description: 'Przy sortowaniu po cenie produkty bez aktywnych wariantów są na końcu',
  })
  sort: AdminProductSort;
}
