import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CART_MAX_QUANTITY,
  cartProblemCodeSchema,
  type AddCartItemInput,
  type Cart,
  type CartItem,
  type CartProblem,
  type CartProblemCode,
  type CartQuantityError,
  type UpdateCartItemInput,
} from '@ziarnista/shared';
import { ProductImageDto } from '../../catalog/dto/product-list.dto';

// Swagger description only; validation is done by the Zod schemas in @ziarnista/shared

export class AddCartItemDto implements AddCartItemInput {
  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiPropertyOptional({ minimum: 1, maximum: CART_MAX_QUANTITY, default: 1 })
  quantity: number;
}

export class UpdateCartItemDto implements UpdateCartItemInput {
  @ApiProperty({
    minimum: 1,
    maximum: CART_MAX_QUANTITY,
    description: 'Nowa ilość pozycji (nie różnica)',
  })
  quantity: number;
}

class CartProblemDto implements CartProblem {
  @ApiProperty({ enum: cartProblemCodeSchema.options })
  code: CartProblemCode;

  @ApiProperty({ example: 'Dostępne tylko 2 szt.' })
  message: string;
}

export class CartItemDto implements CartItem {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty({ example: 'etiopia-guji-hambela' })
  productSlug: string;

  @ApiProperty({ example: 'Etiopia Guji Hambela' })
  productName: string;

  @ApiProperty({ example: '250 g / ziarno' })
  variantLabel: string;

  @ApiProperty({ example: 'ETH-HAMBELA-250-Z' })
  sku: string;

  @ApiProperty({ type: ProductImageDto, nullable: true })
  image: ProductImageDto | null;

  @ApiProperty({ description: 'Grosze, aktualna cena z katalogu', example: 6900 })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Grosze', example: 13800 })
  lineTotal: number;

  @ApiProperty({
    description: 'Najwięcej sztuk, ile ta pozycja może teraz mieć (0 = nie do kupienia)',
    example: 25,
  })
  maxQuantity: number;

  @ApiProperty({ description: 'false = pozycja ma problem i nie wchodzi do sum' })
  available: boolean;

  @ApiProperty({ type: CartProblemDto, nullable: true })
  problem: CartProblemDto | null;
}

export class CartDto implements Cart {
  @ApiProperty({ type: [CartItemDto], description: 'W kolejności dodania' })
  items: CartItemDto[];

  @ApiProperty({ description: 'Sztuki w pozycjach bez problemu', example: 2 })
  itemCount: number;

  @ApiProperty({ description: 'Grosze; tylko pozycje bez problemu', example: 13800 })
  subtotal: number;

  @ApiProperty({ description: 'Grosze; 1499, 0 od progu darmowej wysyłki', example: 1499 })
  shippingCost: number;

  @ApiProperty({ description: 'Grosze', example: 15299 })
  total: number;

  @ApiProperty({ description: 'Grosze', example: 15000 })
  freeShippingThreshold: number;

  @ApiProperty({ description: 'Grosze brakujące do darmowej wysyłki', example: 1200 })
  amountToFreeShipping: number;

  @ApiProperty({ description: 'Koszyk niepusty i żadna pozycja nie ma problemu' })
  canCheckout: boolean;
}

class FieldErrorDto {
  @ApiProperty({ example: 'quantity' })
  path: string;

  @ApiProperty()
  message: string;
}

export class CartQuantityErrorDto implements CartQuantityError {
  @ApiProperty({ example: 409 })
  statusCode: 409;

  @ApiProperty({ example: 'Możesz dodać jeszcze 2 szt. (w koszyku masz już 3 szt.)' })
  message: string;

  @ApiProperty({ enum: [...cartProblemCodeSchema.options, 'CART_LIMIT'] })
  code: CartQuantityError['code'];

  @ApiProperty({
    description:
      'Największa ilość, z którą to samo żądanie się uda: przy POST ile jeszcze można dodać, ' +
      'przy PATCH największa ilość pozycji',
    example: 2,
  })
  available: number;

  @ApiProperty({ type: [FieldErrorDto] })
  errors: FieldErrorDto[];
}
