import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import pdfParse from 'pdf-parse';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Resume is required',
      );
    }

    const pdf = await pdfParse(file.buffer);

    const analysis =
      await this.aiService.analyzeResume(
        pdf.text,
      );

    const resume =
      await this.prisma.resume.create({
        data: {
          fileName: file.originalname,
          content: pdf.text,
          analysis: JSON.stringify(analysis),
          userId,
        },
      });

    return {
      message:
        'Resume uploaded successfully',
      resume,
      analysis,
    };
  }
}