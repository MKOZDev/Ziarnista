import { ApiProperty } from '@nestjs/swagger';
import {
  brewMethodSchema,
  productKindSchema,
  productStatusSchema,
  roastLevelSchema,
  type AdminProductDetail,
  type AdminProductImage,
  type AdminProductListItem,
  type AdminProductListResponse,
  type AdminVariant,
  type BrewMethod,
  type ProductKind,
  type ProductStatus,
  type RoastLevel,
} from '@ziarnista/shared';

export class AdminVariantDto implements AdminVariant {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ETH-HAMBELA-250-Z' })
  sku: string;

  @ApiProperty({ example: '250 g / ziarno' })
  label: string;

  @ApiProperty({ description: 'Grosze', example: 6900 })
  price: number;

  @ApiProperty({ example: 25 })
  stock: number;

  @ApiProperty()
  isActive: boolean;
}

export class AdminProductImageDto implements AdminProductImage {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ example: 'Opakowanie kawy Etiopia Guji Hambela' })
  alt: string;

  @ApiProperty({ example: 0 })
  position: number;
}

export class AdminProductDetailDto implements AdminProductDetail {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: productKindSchema.options })
  kind: ProductKind;

  @ApiProperty({ enum: productStatusSchema.options })
  status: ProductStatus;

  @ApiProperty({ example: 'Etiopia Guji Hambela' })
  name: string;

  @ApiProperty({ example: 'etiopia-guji-hambela' })
  slug: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: String, nullable: true })
  metaTitle: string | null;

  @ApiProperty({ type: String, nullable: true })
  metaDescription: string | null;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  originId: string | null;

  @ApiProperty({ enum: roastLevelSchema.options, nullable: true })
  roastLevel: RoastLevel | null;

  @ApiProperty({ type: [String], example: ['jaśmin', 'bergamotka'] })
  flavorNotes: string[];

  @ApiProperty({ enum: brewMethodSchema.options, isArray: true })
  brewMethods: BrewMethod[];

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Grosze; najniższa cena aktywnego wariantu, null bez aktywnych wariantów',
  })
  minPrice: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: [AdminVariantDto], description: 'Wszystkie, także nieaktywne' })
  variants: AdminVariantDto[];

  @ApiProperty({ type: [AdminProductImageDto], description: 'Według position' })
  images: AdminProductImageDto[];
}

class AdminProductCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Przelew' })
  name: string;
}

class AdminProductThumbnailDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  alt: string;
}

export class AdminProductListItemDto implements AdminProductListItem {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: productKindSchema.options })
  kind: ProductKind;

  @ApiProperty({ enum: productStatusSchema.options })
  status: ProductStatus;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ type: AdminProductCategoryDto })
  category: AdminProductCategoryDto;

  @ApiProperty({ type: Number, nullable: true, description: 'Grosze' })
  minPrice: number | null;

  @ApiProperty()
  variantCount: number;

  @ApiProperty()
  activeVariantCount: number;

  @ApiProperty({ description: 'Suma stanów aktywnych wariantów' })
  totalStock: number;

  @ApiProperty({ type: AdminProductThumbnailDto, nullable: true, description: 'Pierwsze zdjęcie' })
  image: AdminProductThumbnailDto | null;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class AdminProductListResponseDto implements AdminProductListResponse {
  @ApiProperty({ type: [AdminProductListItemDto] })
  items: AdminProductListItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
