import {
  BadRequestException,
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
import {
  MAX_RESUME_FILE_SIZE,
  PDF_MIME_TYPE,
} from '../common/constants/file.constants';

import { CreateResumeInterviewDto } from './dto/create-resume-interview.dto';
import { ResumeService } from './resume.service';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: {
        fileSize: MAX_RESUME_FILE_SIZE,
      },
      fileFilter: (_request, file, callback) => {
        if (file.mimetype !== PDF_MIME_TYPE) {
          callback(
            new BadRequestException(
              'Only PDF resumes are allowed.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadResume(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumeService.upload(
      req.user.userId,
      file,
    );
  }

  @Post('interview')
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: {
        fileSize: MAX_RESUME_FILE_SIZE,
      },
      fileFilter: (_request, file, callback) => {
        if (file.mimetype !== PDF_MIME_TYPE) {
          callback(
            new BadRequestException(
              'Only PDF resumes are allowed.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  generateInterview(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateResumeInterviewDto,
  ) {
    return this.resumeService.generateInterview(
      req.user.userId,
      file,
      dto.difficulty,
      dto.mode,
    );
  }
}