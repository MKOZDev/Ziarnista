import { Global, Module, type DynamicModule } from '@nestjs/common';
import type { Env } from './env.schema';

/** DI token for the validated environment: `@Inject(ENV) env: Env` */
export const ENV = Symbol('ENV');

@Global()
@Module({})
export class ConfigModule {
  // Env is validated in main.ts before Nest starts, so a bad .env fails fast
  // with a readable message instead of a dependency injection error.
  static forRoot(env: Env): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: ENV, useValue: env }],
      exports: [ENV],
    };
  }
}
