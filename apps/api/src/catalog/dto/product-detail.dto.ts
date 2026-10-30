import { ApiProperty } from '@nestjs/swagger';
import {
  brewMethodSchema,
  productKindSchema,
  roastLevelSchema,
  type BrewMethod,
  type ProductDetail,
  type ProductKind,
  type ProductVariant,
  type RoastLevel,
} from '@ziarnista/shared';
import { NamedRefDto } from './named-ref.dto';
import { ProductImageDto } from './product-list.dto';

export class ProductVariantDto implements ProductVariant {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ETH-HAMBELA-250-Z' })
  sku: string;

  @ApiProperty({ example: '250 g / ziarno' })
  label: string;

  @ApiProperty({ description: 'Grosze', example: 6900 })
  price: number;

  @ApiProperty()
  inStock: boolean;
}

export class ProductDetailImageDto extends ProductImageDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
}

export class ProductDetailDto implements ProductDetail {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'etiopia-guji-hambela' })
  slug: string;

  @ApiProperty({ example: 'Etiopia Guji Hambela' })
  name: string;

  @ApiProperty({ enum: productKindSchema.options })
  kind: ProductKind;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: String, nullable: true })
  metaTitle: string | null;

  @ApiProperty({ type: String, nullable: true })
  metaDescription: string | null;

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

  @ApiProperty({ type: NamedRefDto })
  category: NamedRefDto;

  @ApiProperty({ type: [NamedRefDto], description: 'Od kategorii głównej do kategorii produktu' })
  breadcrumbs: NamedRefDto[];

  @ApiProperty({ type: [ProductVariantDto], description: 'Tylko aktywne, od najtańszego' })
  variants: ProductVariantDto[];

  @ApiProperty({ type: [ProductDetailImageDto], description: 'W kolejności position' })
  images: ProductDetailImageDto[];
}
