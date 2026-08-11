import { Module } from '@nestjs/common';

import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { ReportsModule } from '../reports/reports.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    ReportsModule,
    EmailModule,
  ],

  controllers: [
    InterviewsController,
  ],

  providers: [
    InterviewsService,
  ],

  exports: [
    InterviewsService,
  ],
})
export class InterviewsModule {}