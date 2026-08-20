import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateReport(
    interviewId: string,
    userId: string,
  ) {
    const interview =
      await this.prisma.interview.findFirst({
        where: {
          id: interviewId,
          userId,
        },
        include: {
          questions: true,
        },
      });

    if (!interview) {
      throw new NotFoundException(
        'Interview not found.',
      );
    }

    const prompt = `
You are a Senior Technical Interviewer.

Analyze the interview.

Role:
${interview.role}

Difficulty:
${interview.difficulty}

Questions and Answers:

${JSON.stringify(interview.questions)}

Return ONLY JSON.

{
  "overallScore": 85,
  "strengths": "...",
  "weaknesses": "...",
  "feedback": "...",
  "improvements": "..."
}

The overallScore must be a whole number from 0 to 100.
`;

    try {
      const response =
        await this.aiService.generateReport(prompt);

      const cleaned = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const report = JSON.parse(cleaned);

      const existing =
        await this.prisma.interviewReport.findUnique({
          where: {
            interviewId,
          },
        });

      if (existing) {
        return this.prisma.interviewReport.update({
          where: {
            interviewId,
          },
          data: {
            overallScore: report.overallScore,
            strengths: report.strengths,
            weaknesses: report.weaknesses,
            feedback: report.feedback,
            improvements: report.improvements,
          },
        });
      }

      return this.prisma.interviewReport.create({
        data: {
          interviewId,
          overallScore: report.overallScore,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          feedback: report.feedback,
          improvements: report.improvements,
        },
      });
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to generate interview report.',
      );
    }
  }
}