import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app-setup';
import { AppModule } from './app.module';
import { EnvValidationError, loadEnv } from './config/load-env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule.forRoot(env));
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ziarnista API')
    .setDescription('REST API sklepu Ziarnista')
    .setVersion('1.0')
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
