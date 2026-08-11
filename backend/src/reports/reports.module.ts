import { Module } from '@nestjs/common';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
  ],

  exports: [
    ReportsService,
  ],
})
export class ReportsModule {}