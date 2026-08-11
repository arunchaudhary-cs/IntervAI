import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AiService } from '../ai/ai.service';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class InterviewsService {
  
    constructor(
  private readonly prisma: PrismaService,
  private readonly aiService: AiService,
  private readonly reportsService: ReportsService,
  private readonly emailService: EmailService,
) {}

  // ---------------------------------
  // Create Interview
  // ---------------------------------
  async create(userId: string, dto: CreateInterviewDto) {
    try {
      const interview = await this.prisma.interview.create({
        data: {
          role: dto.role,
          difficulty: dto.difficulty,
          status: 'PENDING',
          userId,
        },
      });

      const questions = await this.aiService.generateQuestions(
        dto.role,
        dto.difficulty,
      );

      await this.prisma.question.createMany({
        data: questions.map((q: any) => ({
          question: q.question,
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
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to create interview',
      );
    }
  }

  // ---------------------------------
  // Start Interview
  // ---------------------------------
  async startInterview(
    interviewId: string,
    userId: string,
  ) {
    const interview =
      await this.prisma.interview.findFirst({
        where: {
          id: interviewId,
          userId,
        },
      });

    if (!interview) {
      throw new NotFoundException(
        'Interview not found',
      );
    }

    if (interview.status !== 'PENDING') {
      throw new BadRequestException(
        'Interview already started.',
      );
    }

    return this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        duration: 30,
      },
    });
  }

  // ---------------------------------
  // Submit Answer
  // ---------------------------------
  async submitAnswer(
    interviewId: string,
    questionId: string,
    userId: string,
    answer: string,
  ) {
    const interview =
      await this.prisma.interview.findFirst({
        where: {
          id: interviewId,
          userId,
        },
      });

    if (!interview) {
      throw new NotFoundException(
        'Interview not found',
      );
    }

    const question =
      await this.prisma.question.findUnique({
        where: {
          id: questionId,
        },
      });

    if (!question) {
      throw new NotFoundException(
        'Question not found',
      );
    }

    const evaluation =
      await this.aiService.evaluateAnswer(
        question.question,
        answer,
      );

    return this.prisma.question.update({
      where: {
        id: questionId,
      },
      data: {
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        correctAnswer:
          evaluation.correctAnswer,
      },
    });
  }

  // ---------------------------------
  // Finish Interview
  // ---------------------------------
  async finishInterview(
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
        'Interview not found',
      );
    }

    let total = 0;
    let answered = 0;

    for (const q of interview.questions) {
      if (q.score !== null) {
        total += q.score;
        answered++;
      }
    }

    const average =
      answered === 0 ? 0 : total / answered;

    await this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        averageScore: average,
      },
    });

    await this.reportsService.generateReport(
      interviewId,
    );
    const user = await this.prisma.user.findUnique({
  where: {
    id: userId,
  },
});

if (user) {
  await this.emailService.sendInterviewCompletedEmail(
    user.email,
    user.name,
    interview.role,
    Math.round(average),
  );
}

    return {
      message:
        'Interview completed successfully.',
      averageScore: average,
    };
  }

  // ---------------------------------
  // Result
  // ---------------------------------
  async getResult(
    id: string,
    userId: string,
  ) {
    const interview =
      await this.prisma.interview.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          questions: true,
          report: true,
        },
      });

    if (!interview) {
      throw new NotFoundException(
        'Interview not found',
      );
    }

    return interview;
  }

  // ---------------------------------
  // List Interviews
  // ---------------------------------
  async findAll(userId: string) {
    return this.prisma.interview.findMany({
      where: {
        userId,
      },
      include: {
        questions: true,
        report: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ---------------------------------
  // Find One
  // ---------------------------------
  async findOne(
  id: string,
  userId: string,
) {
  const interview =
    await this.prisma.interview.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        questions: true,
        report: true,
      },
    });

  if (!interview) {
    throw new NotFoundException(
      'Interview not found',
    );
  }

  return interview;
}

  // ---------------------------------
  // Delete
  // ---------------------------------
  async remove(
    id: string,
    userId: string,
  ) {
    return this.prisma.interview.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}