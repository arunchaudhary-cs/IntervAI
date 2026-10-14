import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  @Post()
  create(
    @Request() req,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(
      req.user.userId,
      dto,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.interviewsService.findAll(
      req.user.userId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.findOne(
      id,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.remove(
      id,
      req.user.userId,
    );
  }

  @Get(':id/result')
  getResult(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.getResult(
      id,
      req.user.userId,
    );
  }

  @Post(':id/start')
  startInterview(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.startInterview(
      id,
      req.user.userId,
    );
  }

  @Post(':id/questions/:questionId/answer')
  submitAnswer(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Request() req,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.interviewsService.submitAnswer(
      id,
      questionId,
      req.user.userId,
      dto.answer,
    );
  }

  @Post(':id/finish')
  finishInterview(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.finishInterview(
      id,
      req.user.userId,
    );
  }

  @Post(':id/tab-switch')
  logTabSwitch(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.interviewsService.logTabSwitch(
      id,
      req.user.userId,
    );
  }
}