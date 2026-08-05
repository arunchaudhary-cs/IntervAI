import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  @ApiOperation({
    summary: 'Create a new interview',
  })
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Get all interviews of the logged-in user',
  })
  @Get()
  findAll(@Req() req: any) {
    return this.interviewsService.findAll(
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Get interview by ID',
  })
  @ApiParam({
    name: 'id',
    example: 'cm123abc456',
  })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.interviewsService.findOne(
      id,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Get complete interview result',
  })
  @ApiParam({
    name: 'id',
    example: 'cm123abc456',
  })
  @Get(':id/result')
  getResult(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.interviewsService.getResult(
      id,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Delete an interview',
  })
  @ApiParam({
    name: 'id',
    example: 'cm123abc456',
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.interviewsService.remove(
      id,
      req.user.userId,
    );
  }
}