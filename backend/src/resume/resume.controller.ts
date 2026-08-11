import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ResumeService } from './resume.service';
import { CreateResumeInterviewDto } from './dto/create-resume-interview.dto';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
  ) {}

  // -------------------------------
  // Upload Resume
  // -------------------------------
  @Post('upload')
  @UseInterceptors(FileInterceptor('resume'))
  uploadResume(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.resumeService.upload(
      req.user.userId,
      file,
    );
  }

  // -------------------------------
  // Generate Interview From Resume
  // -------------------------------
  @Post('interview')
  @UseInterceptors(FileInterceptor('resume'))
  generateInterview(
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
    @Body()
    dto: CreateResumeInterviewDto,
  ) {
    return this.resumeService.generateInterview(
      req.user.userId,
      file,
      dto.difficulty,
    );
  }
}