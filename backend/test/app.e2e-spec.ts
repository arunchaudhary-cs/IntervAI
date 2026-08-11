import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('IntervAI E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------
  // Health Check
  // ---------------------------------

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200);
  });

  // ---------------------------------
  // Invalid Route
  // ---------------------------------

  it('/invalid-route (GET)', () => {
    return request(app.getHttpServer())
      .get('/invalid-route')
      .expect(404);
  });
});