import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app-setup';
import { AppModule } from './app.module';
import { ADMIN_SESSION_AUTH, STOREFRONT_SESSION_AUTH } from './auth/decorators/auth.decorator';
import { SESSION_POLICIES } from './auth/session-policy';
import { EnvValidationError, loadEnv } from './config/load-env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env));
  // Only proxies listed here may set X-Forwarded-For, so a client cannot spoof its IP
  // (and with it the login rate limit) by sending the header itself
  app.set('trust proxy', env.TRUST_PROXY);
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ziarnista API')
    .setDescription(
      'REST API sklepu Ziarnista. Sesje w cookies httpOnly: zaloguj się przez /auth/login ' +
        'lub /admin/auth/login, a przeglądarka dołączy cookie do kolejnych żądań. ' +
        'Żądania POST/PATCH/PUT/DELETE wymagają nagłówka Origin z listy ALLOWED_ORIGINS.',
    )
    .setVersion('1.0')
    .addCookieAuth(
      SESSION_POLICIES.STOREFRONT.cookieName,
      { type: 'apiKey', in: 'cookie' },
      STOREFRONT_SESSION_AUTH,
    )
    .addCookieAuth(
      SESSION_POLICIES.ADMIN.cookieName,
      { type: 'apiKey', in: 'cookie' },
      ADMIN_SESSION_AUTH,
    )
    .build();
  // Outside the /api/v1 prefix: docs are not a versioned endpoint
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(env.API_PORT);
  Logger.log(`API listening on http://localhost:${env.API_PORT}/api/v1`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof EnvValidationError ? error.message : error);
  process.exit(1);
});
