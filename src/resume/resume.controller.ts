import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ResumeService } from './resume.service';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resume'),
  )
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
}