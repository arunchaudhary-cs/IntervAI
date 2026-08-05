import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(userId: string) {
    const interviews =
      await this.prisma.interview.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    const totalInterviews =
      interviews.length;

    const completedInterviews =
      interviews.filter(
        (i) => i.status === 'COMPLETED',
      ).length;

    const pendingInterviews =
      interviews.filter(
        (i) => i.status !== 'COMPLETED',
      ).length;

    const scoredInterviews =
      interviews.filter(
        (i) => i.averageScore !== null,
      );

    const averageScore =
      scoredInterviews.length === 0
        ? 0
        : scoredInterviews.reduce(
            (sum, interview) =>
              sum + (interview.averageScore ?? 0),
            0,
          ) / scoredInterviews.length;

    const bestScore =
      scoredInterviews.length === 0
        ? 0
        : Math.max(
            ...scoredInterviews.map(
              (i) => i.averageScore ?? 0,
            ),
          );

    return {
      totalInterviews,
      completedInterviews,
      pendingInterviews,
      averageScore,
      bestScore,

      recentInterviews:
        interviews.slice(0, 5),
    };
  }
}