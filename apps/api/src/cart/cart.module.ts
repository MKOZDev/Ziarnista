import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { CartMergeModule } from './cart-merge.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

/** Shopping cart of guests and logged-in customers */
@Module({
  imports: [AuthModule, CartMergeModule, StorageModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
