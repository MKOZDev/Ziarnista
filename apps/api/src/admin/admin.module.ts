import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { AdminCategoriesService } from './categories/admin-categories.service';
import { AdminOriginsController } from './origins/admin-origins.controller';
import { AdminOriginsService } from './origins/admin-origins.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { ProductVariantsService } from './products/product-variants.service';

/** Catalog management for the admin panel; every route requires an admin session */
@Module({
  imports: [AuthModule],
  controllers: [AdminCategoriesController, AdminOriginsController, AdminProductsController],
  providers: [
    AdminCategoriesService,
    AdminOriginsService,
    AdminProductsService,
    ProductVariantsService,
  ],
})
export class AdminModule {}
