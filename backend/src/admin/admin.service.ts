import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------
  // Dashboard Statistics
  // ---------------------------------

  async getDashboard() {
    const totalUsers =
      await this.prisma.user.count();

    const totalInterviews =
      await this.prisma.interview.count();

    const completedInterviews =
      await this.prisma.interview.count({
        where: {
          status: 'COMPLETED',
        },
      });

    const pendingInterviews =
      await this.prisma.interview.count({
        where: {
          status: 'PENDING',
        },
      });

    const inProgressInterviews =
      await this.prisma.interview.count({
        where: {
          status: 'IN_PROGRESS',
        },
      });

    const averageScore =
      await this.prisma.interview.aggregate({
        _avg: {
          averageScore: true,
        },
        where: {
          status: 'COMPLETED',
        },
      });

    return {
      totalUsers,
      totalInterviews,
      completedInterviews,
      pendingInterviews,
      inProgressInterviews,
      averageScore:
        averageScore._avg.averageScore ?? 0,
    };
  }

  // ---------------------------------
  // Get All Users
  // ---------------------------------

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        _count: {
          select: {
            interviews: true,
            resumes: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ---------------------------------
  // Get All Interviews
  // ---------------------------------

  async getInterviews() {
    return this.prisma.interview.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        report: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ---------------------------------
  // Get Recent Users
  // ---------------------------------

  async getRecentUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 10,
    });
  }

  // ---------------------------------
  // Update User Role
  // ---------------------------------

  async updateUserRole(
    userId: string,
    role: string,
  ) {
    const allowedRoles = [
      'USER',
      'ADMIN',
    ];

    const normalizedRole =
      role?.toUpperCase();

    if (
      !normalizedRole ||
      !allowedRoles.includes(normalizedRole)
    ) {
      throw new BadRequestException(
        'Role must be USER or ADMIN',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        role: normalizedRole,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}