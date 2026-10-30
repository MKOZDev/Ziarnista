import { Module, type DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ConfigModule } from './config/config.module';
import type { Env } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { OriginGuard } from './security/origin.guard';

@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [ConfigModule.forRoot(env), PrismaModule, HealthModule, AuthModule, CatalogModule],
      // Global, so no mutating endpoint can forget the CSRF check
      providers: [{ provide: APP_GUARD, useClass: OriginGuard }],
    };
  }
}
