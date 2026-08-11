import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------
  // User Dashboard
  // ---------------------------------

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const totalInterviews =
      await this.prisma.interview.count({
        where: {
          userId,
        },
      });

    const completedInterviews =
      await this.prisma.interview.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      });

    const pendingInterviews =
      await this.prisma.interview.count({
        where: {
          userId,
          status: 'PENDING',
        },
      });

    const inProgressInterviews =
      await this.prisma.interview.count({
        where: {
          userId,
          status: 'IN_PROGRESS',
        },
      });

    const averageScore =
      await this.prisma.interview.aggregate({
        _avg: {
          averageScore: true,
        },
        where: {
          userId,
          status: 'COMPLETED',
        },
      });

    return {
      totalInterviews,
      completedInterviews,
      pendingInterviews,
      inProgressInterviews,
      averageScore:
        averageScore._avg.averageScore ?? 0,
    };
  }

  // ---------------------------------
  // Interview History
  // Pagination + Filtering
  // ---------------------------------

  async getInterviewHistory(
    userId: string,
    page = 1,
    limit = 10,
    status?: string,
    difficulty?: string,
  ) {
    // Prevent invalid values
    page = Math.max(1, Number(page) || 1);

    limit = Math.min(
      50,
      Math.max(1, Number(limit) || 10),
    );

    const skip = (page - 1) * limit;

    // Build filters
    const where: any = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get interviews and total count
    const [interviews, total] =
      await Promise.all([
        this.prisma.interview.findMany({
          where,

          select: {
            id: true,
            role: true,
            difficulty: true,
            status: true,
            averageScore: true,
            createdAt: true,
            completedAt: true,

            report: {
              select: {
                overallScore: true,
                strengths: true,
                weaknesses: true,
                feedback: true,
                improvements: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          skip,
          take: limit,
        }),

        this.prisma.interview.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    return {
      data: interviews,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    };
  }
}