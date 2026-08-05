import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionsService } from './questions.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@ApiTags('Questions')
@ApiBearerAuth()
@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
  ) {}

  @ApiOperation({
    summary: 'Get all questions of an interview',
  })
  @ApiParam({
    name: 'interviewId',
    example: 'cm123abc456',
  })
  @Get(':interviewId')
  getQuestions(
    @Param('interviewId') interviewId: string,
  ) {
    return this.questionsService.getQuestions(
      interviewId,
    );
  }

  @ApiOperation({
    summary: 'Submit answer for a question',
  })
  @ApiParam({
    name: 'questionId',
    example: 'cm987xyz123',
  })
  @Post(':questionId/answer')
  submitAnswer(
    @Param('questionId') questionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.questionsService.submitAnswer(
      questionId,
      dto.answer,
    );
  }
}