import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateInterviewDto) {
    try {
      // Create Interview
      const interview = await this.prisma.interview.create({
        data: {
          role: dto.role,
          difficulty: dto.difficulty,
          userId,
        },
      });

      // Generate Questions
      const questions =
        await this.aiService.generateQuestions(
          dto.role,
          dto.difficulty,
        );

      if (!Array.isArray(questions)) {
        throw new Error('Gemini returned invalid JSON');
      }

      // Save Questions
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

  async findAll(userId: string) {
    return this.prisma.interview.findMany({
      where: {
        userId,
      },
      include: {
        questions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.interview.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        questions: true,
      },
    });
  }

  // NEW RESULT API
  async getResult(id: string, userId: string) {
    const interview =
      await this.prisma.interview.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          questions: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      });

    if (!interview) {
      throw new NotFoundException(
        'Interview not found',
      );
    }

    return interview;
  }

  async remove(id: string, userId: string) {
    return this.prisma.interview.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}