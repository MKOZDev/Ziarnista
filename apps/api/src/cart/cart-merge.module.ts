import { Module } from '@nestjs/common';
import { CartCookies } from './cart-cookies';
import { CartMergeService } from './cart-merge.service';

/**
 * The part of the cart the auth endpoints need (cookie + merge after login). Kept apart
 * from CartModule, which imports AuthModule for its guards: AuthModule imports this one,
 * so the two never import each other.
 */
@Module({
  providers: [CartCookies, CartMergeService],
  exports: [CartCookies, CartMergeService],
})
export class CartMergeModule {}
