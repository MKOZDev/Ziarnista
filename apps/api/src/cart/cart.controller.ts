import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { addCartItemSchema, updateCartItemSchema, type Cart } from '@ziarnista/shared';
import type { Request, Response } from 'express';
import { OptionalAuth } from '../auth/decorators/auth.decorator';
import { OptionalUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../auth/public-user';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  CART_ITEM_NOT_FOUND_MESSAGE,
  CartService,
  VARIANT_NOT_FOUND_MESSAGE,
} from './cart.service';
import { AddCartItemDto, CartDto, CartQuantityErrorDto, UpdateCartItemDto } from './dto/cart.dto';

// Every change answers with the whole cart: totals and flags change along with any line,
// so the shop re-renders from one response instead of asking again.
@ApiTags('cart')
@OptionalAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Koszyk zalogowanego klienta albo gościa (cookie zia_cart)',
    description:
      'Ceny aktualne z katalogu. Pozycje niedostępne zostają w koszyku z flagą i komunikatem, ' +
      'nie wchodzą do sum i blokują zamówienie (canCheckout: false). Bez koszyka: pusty.',
  })
  @ApiOkResponse({ type: CartDto })
  get(@OptionalUser() user: PublicUser | null, @Req() req: Request): Promise<Cart> {
    return this.cart.get(user, req);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dodanie do koszyka; ten sam wariant zwiększa ilość pozycji',
    description: 'Gość bez koszyka dostaje cookie zia_cart (30 dni, odnawiane przy zmianach).',
  })
  @ApiOkResponse({ type: CartDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe dane (ilość 1–99)' })
  @ApiNotFoundResponse({ description: VARIANT_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({
    type: CartQuantityErrorDto,
    description: 'Za mało w magazynie, limit 99 szt. albo produkt niedostępny; ilość bez zmian',
  })
  add(
    @OptionalUser() user: PublicUser | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(addCartItemSchema)) body: AddCartItemDto,
  ): Promise<Cart> {
    return this.cart.add(user, req, res, body);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Zmiana ilości pozycji' })
  @ApiOkResponse({ type: CartDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe dane (ilość 1–99)' })
  @ApiNotFoundResponse({ description: CART_ITEM_NOT_FOUND_MESSAGE })
  @ApiConflictResponse({
    type: CartQuantityErrorDto,
    description: 'Za mało w magazynie albo produkt niedostępny; ilość bez zmian',
  })
  update(
    @OptionalUser() user: PublicUser | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemDto,
  ): Promise<Cart> {
    return this.cart.update(user, req, res, id, body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Usunięcie pozycji (także niedostępnej); odpowiedź to koszyk' })
  @ApiOkResponse({ type: CartDto })
  @ApiNotFoundResponse({ description: CART_ITEM_NOT_FOUND_MESSAGE })
  remove(
    @OptionalUser() user: PublicUser | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<Cart> {
    return this.cart.remove(user, req, res, id);
  }
}
