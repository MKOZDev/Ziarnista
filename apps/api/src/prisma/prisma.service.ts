import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env.schema';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  }

  // No explicit $connect() on init: the connection opens lazily, so the API
  // starts even when the database is down and /health can report it.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
