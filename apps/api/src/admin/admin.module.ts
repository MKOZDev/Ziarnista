import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { AdminCategoriesService } from './categories/admin-categories.service';
import { AdminOriginsController } from './origins/admin-origins.controller';
import { AdminOriginsService } from './origins/admin-origins.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { ProductImagesController } from './products/images/product-images.controller';
import { ProductImagesService } from './products/images/product-images.service';
import { ProductVariantsService } from './products/product-variants.service';

/** Catalog management for the admin panel; every route requires an admin session */
@Module({
  imports: [AuthModule, StorageModule],
  controllers: [
    AdminCategoriesController,
    AdminOriginsController,
    AdminProductsController,
    ProductImagesController,
  ],
  providers: [
    AdminCategoriesService,
    AdminOriginsService,
    AdminProductsService,
    ProductVariantsService,
    ProductImagesService,
  ],
})
export class AdminModule {}
