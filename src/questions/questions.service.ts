import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // ----------------------------
  // Get all questions of interview
  // ----------------------------
  async getQuestions(interviewId: string) {
    return this.prisma.question.findMany({
      where: {
        interviewId,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // ----------------------------
  // Submit answer
  // ----------------------------
  async submitAnswer(
    questionId: string,
    answer: string,
  ) {
    // Find question
    const question = await this.prisma.question.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      throw new NotFoundException(
        'Question not found',
      );
    }

    // Evaluate using Gemini
    const evaluation =
      await this.aiService.evaluateAnswer(
        question.question,
        answer,
      );

    // Save answer
    const updatedQuestion =
      await this.prisma.question.update({
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

    // Check if interview completed
    const questions =
      await this.prisma.question.findMany({
        where: {
          interviewId:
            question.interviewId,
        },
      });

    const completed =
      questions.every(
        (q) => q.answer !== null,
      );

    if (completed) {
      const total =
        questions.reduce(
          (sum, q) =>
            sum + (q.score ?? 0),
          0,
        );

      const average =
        total / questions.length;

      await this.prisma.interview.update({
        where: {
          id: question.interviewId,
        },
        data: {
          status: 'COMPLETED',
          averageScore: average,
        },
      });
    }

    return updatedQuestion;
  }
}