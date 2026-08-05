import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
} from '@nestjs/common';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  // Global Response Interceptor
  app.useGlobalInterceptors(
    new TransformInterceptor(),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('IntervAI API')
    .setDescription(
      'AI Powered Interview Platform Backend API',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Access Token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup(
    'api',
    app,
    document,
  );

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(
    `🚀 Server running at: http://localhost:${port}`,
  );

  console.log(
    `📚 Swagger Docs: http://localhost:${port}/api`,
  );
}

bootstrap();