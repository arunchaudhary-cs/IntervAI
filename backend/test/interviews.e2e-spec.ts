import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Interviews E2E', () => {
  let app: INestApplication;

  let accessToken: string;
  let interviewId: string;
  let questionId: string;

  const testUser = {
    name: `Interview Test User ${Date.now()}`,
    email: `interview${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // ---------------------------------
    // Register test user
    // ---------------------------------

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    // ---------------------------------
    // Login test user
    // ---------------------------------

    const loginResponse = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    accessToken =
      loginResponse.body.access_token;

    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------
  // Unauthorized access
  // ---------------------------------

  it(
    'GET /interviews - should reject unauthenticated request',
    async () => {
      await request(app.getHttpServer())
        .get('/interviews')
        .expect(401);
    },
  );

  // ---------------------------------
  // Create Interview
  // ---------------------------------

  it(
    'POST /interviews - should create interview',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/interviews')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          role: 'Java Backend Developer',
          difficulty: 'Medium',
        })
        .expect(201);

      expect(response.body).toBeDefined();

      expect(response.body.id).toBeDefined();

      expect(response.body.role).toBe(
        'Java Backend Developer',
      );

      expect(response.body.difficulty).toBe(
        'Medium',
      );

      expect(response.body.status).toBe(
        'PENDING',
      );

      expect(
        response.body.questions,
      ).toBeDefined();

      expect(
        Array.isArray(
          response.body.questions,
        ),
      ).toBe(true);

      expect(
        response.body.questions.length,
      ).toBeGreaterThan(0);

      interviewId = response.body.id;

      questionId =
        response.body.questions[0].id;

      expect(questionId).toBeDefined();
    },
    60000,
  );

  // ---------------------------------
  // Get All Interviews
  // ---------------------------------

  it(
    'GET /interviews - should return user interviews',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .get('/interviews')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();

      expect(
        Array.isArray(response.body),
      ).toBe(true);

      expect(
        response.body.length,
      ).toBeGreaterThan(0);
    },
  );

  // ---------------------------------
  // Get Single Interview
  // ---------------------------------

  it(
    'GET /interviews/:id - should return interview',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .get(`/interviews/${interviewId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();

      expect(response.body.id).toBe(
        interviewId,
      );

      expect(response.body.questions).toBeDefined();
    },
  );

  // ---------------------------------
  // Start Interview
  // ---------------------------------

  it(
    'POST /interviews/:id/start - should start interview',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post(
          `/interviews/${interviewId}/start`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(201);

      expect(response.body).toBeDefined();

      expect(response.body.status).toBe(
        'IN_PROGRESS',
      );

      expect(
        response.body.startedAt,
      ).toBeDefined();

      expect(response.body.duration).toBe(30);
    },
  );

  // ---------------------------------
  // Submit Answer
  // ---------------------------------

  it(
    'POST /interviews/:id/questions/:questionId/answer - should evaluate answer',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post(
          `/interviews/${interviewId}/questions/${questionId}/answer`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          answer:
            'The JVM is the Java Virtual Machine. It executes Java bytecode and provides platform independence.',
        })
        .expect(201);

      expect(response.body).toBeDefined();

      expect(response.body.answer).toBeDefined();

      expect(response.body.score).toBeDefined();

      expect(response.body.feedback).toBeDefined();

      expect(
        response.body.correctAnswer,
      ).toBeDefined();
    },
    60000,
  );

  // ---------------------------------
  // Finish Interview
  // ---------------------------------

  it(
    'POST /interviews/:id/finish - should complete interview',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post(
          `/interviews/${interviewId}/finish`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(201);

      expect(response.body).toBeDefined();

      expect(
        response.body.message,
      ).toBe(
        'Interview completed successfully.',
      );

      expect(
        response.body.averageScore,
      ).toBeDefined();

      expect(
        typeof response.body.averageScore,
      ).toBe('number');
    },
    60000,
  );

  // ---------------------------------
  // Get Final Result
  // ---------------------------------

  it(
    'GET /interviews/:id/result - should return completed interview and report',
    async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .get(
          `/interviews/${interviewId}/result`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();

      expect(response.body.id).toBe(
        interviewId,
      );

      expect(response.body.status).toBe(
        'COMPLETED',
      );

      expect(
        response.body.averageScore,
      ).toBeDefined();

      expect(
        response.body.questions,
      ).toBeDefined();

      expect(
        response.body.report,
      ).toBeDefined();
    },
  );

  // ---------------------------------
  // Invalid Interview
  // ---------------------------------

  it(
    'GET /interviews/invalid-id - should return not found',
    async () => {
      await request(app.getHttpServer())
        .get(
          '/interviews/this-interview-does-not-exist',
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(404);
    },
  );
});