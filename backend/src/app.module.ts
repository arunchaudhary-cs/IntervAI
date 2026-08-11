import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { InterviewsModule } from './interviews/interviews.module';
import { ResumeModule } from './resume/resume.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        GEMINI_API_KEY: Joi.string().required(),

        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().optional(),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASSWORD: Joi.string().optional(),
        SMTP_FROM: Joi.string().optional(),
      }),
    }),

    // Global rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    AiModule,
    InterviewsModule,
    ResumeModule,
    ReportsModule,
    HealthModule,
    EmailModule,
    AdminModule,
    UsersModule,
  ],

  providers: [
    // Makes ThrottlerGuard active globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}