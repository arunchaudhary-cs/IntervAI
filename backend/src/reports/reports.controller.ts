import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Post(':id')
  createReport(
    @Param('id') interviewId: string,
    @Req() req: any,
  ) {
    return this.reportsService.generateReport(
      interviewId,
      req.user.userId,
    );
  }
}