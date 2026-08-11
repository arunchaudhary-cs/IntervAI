import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Authentication E2E', () => {
  let app: INestApplication;

  let accessToken: string;

  const testUser = {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

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
  // Register
  // ---------------------------------

  it('POST /auth/register - should register user', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toBeDefined();
  });

  // ---------------------------------
  // Login
  // ---------------------------------

  it('POST /auth/login - should login user', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    expect(response.body).toBeDefined();

    // Your API returns access_token, not accessToken
    expect(response.body.access_token).toBeDefined();

    // Save token for protected endpoint tests
    accessToken = response.body.access_token;

    // Also verify refresh token exists
    expect(response.body.refresh_token).toBeDefined();
  });

  // ---------------------------------
  // Invalid Login
  // ---------------------------------

  it('POST /auth/login - should reject invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  // ---------------------------------
  // Protected Profile
  // ---------------------------------

  it('GET /auth/profile - should return authenticated user', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/auth/profile')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body).toBeDefined();

    expect(response.body.user).toBeDefined();

    expect(response.body.user.email).toBe(
      testUser.email,
    );
  });

  // ---------------------------------
  // Profile Without Token
  // ---------------------------------

  it('GET /auth/profile - should reject unauthenticated request', async () => {
    await request(app.getHttpServer())
      .get('/auth/profile')
      .expect(401);
  });
});