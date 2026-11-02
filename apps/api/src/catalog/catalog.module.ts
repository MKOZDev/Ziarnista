import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

/** Public, read-only catalog for the storefront */
@Module({
  imports: [StorageModule],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
})
export class CatalogModule {}
