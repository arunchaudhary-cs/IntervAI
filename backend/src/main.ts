import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS: supports specific domains or wildcard reflection for preview/production deployments
  const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL;

  let corsOrigin: any = true; // Default: allow all origins so requests from Vercel never fail
  if (rawOrigins && rawOrigins !== '*') {
    corsOrigin = rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('IntervAI API')
    .setDescription('AI Interview Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document =
    SwaggerModule.createDocument(
      app,
      config,
    );

  SwaggerModule.setup(
    'api',
    app,
    document,
  );

  const port =
    process.env.PORT || 3000;

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `Server Running : http://localhost:${port}`,
  );

  console.log(
    `Swagger : http://localhost:${port}/api`,
  );
}

bootstrap();
