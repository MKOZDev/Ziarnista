import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { AdminCategoriesService } from './categories/admin-categories.service';
import { AdminOriginsController } from './origins/admin-origins.controller';
import { AdminOriginsService } from './origins/admin-origins.service';

/** Catalog management for the admin panel; every route requires an admin session */
@Module({
  imports: [AuthModule],
  controllers: [AdminCategoriesController, AdminOriginsController],
  providers: [AdminCategoriesService, AdminOriginsService],
})
export class AdminModule {}
