import { Module } from '@nestjs/common';

import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}