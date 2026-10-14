import {
  BadRequestException,
  Injectable,
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

  private validatePdfFile(
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Resume is required.',
      );
    }

    const header = file.buffer
      .subarray(0, 4)
      .toString('utf8');

    if (header !== '%PDF') {
      throw new BadRequestException(
        'The uploaded file is not a valid PDF.',
      );
    }
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
  ) {
    this.validatePdfFile(file);

    const pdf = await pdfParse(file.buffer);

    const analysis = await this.aiService.analyzeResume(
      pdf.text,
    );

    const resume = await this.prisma.resume.create({
      data: {
        fileName: file.originalname,
        content: pdf.text,
        analysis: JSON.stringify(analysis),
        userId,
      },
    });

    return {
      message: 'Resume uploaded successfully',
      resume,
      analysis,
    };
  }

  async generateInterview(
    userId: string,
    file: Express.Multer.File,
    difficulty: string,
    modeParam?: string,
  ) {
    this.validatePdfFile(file);

    const pdf = await pdfParse(file.buffer);

    const result =
      await this.aiService.generateInterviewFromResume(
        pdf.text,
        difficulty,
      );

    const mode = modeParam === 'VOICE' ? 'VOICE' : 'TEXT';
    const duration = mode === 'VOICE' ? 15 : 30;

    const interview =
      await this.prisma.interview.create({
        data: {
          role: result.role,
          difficulty,
          mode,
          duration,
          status: 'PENDING',
          userId,
        },
      });

    await this.prisma.question.createMany({
      data: result.questions.map((question: any) => ({
        question: question.question,
        interviewId: interview.id,
      })),
    });

    return this.prisma.interview.findUnique({
      where: {
        id: interview.id,
      },
      include: {
        questions: true,
      },
    });
  }
}