import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AiService } from '../ai/ai.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { normalizeScore } from '../common/constants/score.constants';

import { CreateInterviewDto } from './dto/create-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly reportsService: ReportsService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    userId: string,
    dto: CreateInterviewDto,
  ) {
    try {
      const mode = dto.mode === 'VOICE' ? 'VOICE' : 'TEXT';
      const duration = mode === 'VOICE' ? 15 : 30; // 15 minutes for voice (including follow-ups)

      const interview = await this.prisma.interview.create({
        data: {
          role: dto.role,
          difficulty: dto.difficulty,
          mode,
          duration,
          status: 'PENDING',
          userId,
        },
      });

      const questions =
        await this.aiService.generateQuestions(
          dto.role,
          dto.difficulty,
        );

      await this.prisma.question.createMany({
        data: questions.map((question: any) => ({
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
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to create interview.',
      );
    }
  }

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
        'Interview not found.',
      );
    }

    if (interview.status === 'COMPLETED') {
      throw new BadRequestException(
        'Interview is already completed.',
      );
    }

    if (interview.status === 'IN_PROGRESS') {
      return interview;
    }

    const duration = interview.mode === 'VOICE' ? 15 : (interview.duration || 30);

    return this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        duration,
      },
    });
  }

  async logTabSwitch(interviewId: string, userId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, userId },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found.');
    }

    return this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        tabSwitches: { increment: 1 },
      },
    });
  }

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
        'Interview not found.',
      );
    }

    if (interview.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'This interview is not in progress.',
      );
    }

    const question =
      await this.prisma.question.findUnique({
        where: {
          id: questionId,
        },
      });

    if (!question || question.interviewId !== interviewId) {
      throw new NotFoundException(
        'Question not found.',
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
        score: normalizeScore(evaluation.score),
        feedback: evaluation.feedback,
        correctAnswer: evaluation.correctAnswer,
        followUp: evaluation.followUpQuestion,
      },
    });
  }

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
        'Interview not found.',
      );
    }

    if (interview.status === 'COMPLETED') {
      return {
        message: 'Interview is already completed.',
        averageScore: interview.averageScore ?? 0,
      };
    }

    let total = 0;
    let answered = 0;

    for (const question of interview.questions) {
      if (question.score !== null && question.score !== undefined) {
        total += question.score;
        answered++;
      }
    }

    const totalQuestions = interview.questions.length || 1;
    const averageScore =
      answered === 0 ? 0 : Number((total / totalQuestions).toFixed(1));

    await this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        averageScore,
      },
    });

    await this.reportsService.generateReport(
      interviewId,
      userId,
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
        Math.round(averageScore),
      );
    }

    return {
      message: 'Interview completed successfully.',
      averageScore,
    };
  }

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
        'Interview not found.',
      );
    }

    return interview;
  }

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
        'Interview not found.',
      );
    }

    return interview;
  }

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