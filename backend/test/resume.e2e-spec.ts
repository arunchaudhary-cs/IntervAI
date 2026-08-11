import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Resume E2E', () => {
  let app: INestApplication;

  let accessToken: string;

  const testUser = {
    name: `Resume Test User ${Date.now()}`,
    email: `resume${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  /*
   * Minimal valid PDF.
   *
   * We create it as a Buffer so you don't
   * need to create a resume file manually.
   */
  const pdfBuffer = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 140 >>
stream
BT
/F1 12 Tf
72 720 Td
(Java Backend Developer) Tj
0 -30 Td
(Java Spring Boot PostgreSQL REST API Docker) Tj
0 -30 Td
(Software Engineer) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000131 00000 n
0000000300 00000 n
0000000489 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
559
%%EOF`,
    'utf8',
  );

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
    // Register
    // ---------------------------------

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    // ---------------------------------
    // Login
    // ---------------------------------

    const loginResponse =
      await request(app.getHttpServer())
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
  // Unauthorized Upload
  // ---------------------------------

  it(
    'POST /resume/upload - should reject unauthenticated request',
    async () => {
      await request(app.getHttpServer())
        .post('/resume/upload')
        .attach(
          'resume',
          pdfBuffer,
          'resume.pdf',
        )
        .expect(401);
    },
  );

  // ---------------------------------
  // Upload Without File
  // ---------------------------------

  it(
    'POST /resume/upload - should reject missing resume',
    async () => {
      await request(app.getHttpServer())
        .post('/resume/upload')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(400);
    },
  );

  // ---------------------------------
  // Upload Resume
  // ---------------------------------

  it(
    'POST /resume/upload - should upload and analyze resume',
    async () => {
      const response =
        await request(app.getHttpServer())
          .post('/resume/upload')
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .attach(
            'resume',
            pdfBuffer,
            'resume.pdf',
          )
          .expect(201);

      expect(response.body).toBeDefined();

      expect(response.body.message).toBe(
        'Resume uploaded successfully',
      );

      expect(response.body.resume).toBeDefined();

      expect(response.body.resume.fileName).toBe(
        'resume.pdf',
      );

      expect(response.body.analysis).toBeDefined();
    },
    60000,
  );

  // ---------------------------------
  // Generate Interview Without File
  // ---------------------------------

  it(
    'POST /resume/interview - should reject missing resume',
    async () => {
      await request(app.getHttpServer())
        .post('/resume/interview')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .field('difficulty', 'Medium')
        .expect(400);
    },
  );

  // ---------------------------------
  // Generate Interview From Resume
  // ---------------------------------

  it(
    'POST /resume/interview - should generate interview from resume',
    async () => {
      const response =
        await request(app.getHttpServer())
          .post('/resume/interview')
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .field('difficulty', 'Medium')
          .attach(
            'resume',
            pdfBuffer,
            'resume.pdf',
          )
          .expect(201);

      expect(response.body).toBeDefined();

      expect(response.body.id).toBeDefined();

      expect(response.body.role).toBeDefined();

      expect(response.body.difficulty).toBe(
        'Medium',
      );

      expect(response.body.status).toBe(
        'PENDING',
      );

      expect(response.body.questions).toBeDefined();

      expect(
        Array.isArray(response.body.questions),
      ).toBe(true);

      expect(
        response.body.questions.length,
      ).toBeGreaterThan(0);
    },
    60000,
  );
});