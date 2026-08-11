import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InterviewsService } from '../src/interviews/interviews.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiService } from '../src/ai/ai.service';
import { ReportsService } from '../src/reports/reports.service';
import { EmailService } from '../src/email/email.service';

describe('InterviewsService', () => {
  let service: InterviewsService;

  const prismaMock = {
    interview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },

    question: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },

    user: {
      findUnique: jest.fn(),
    },
  };

  const aiServiceMock = {
    generateQuestions: jest.fn(),
    evaluateAnswer: jest.fn(),
  };

  const reportsServiceMock = {
    generateReport: jest.fn(),
  };

  const emailServiceMock = {
    sendInterviewCompletedEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          InterviewsService,

          {
            provide: PrismaService,
            useValue: prismaMock,
          },

          {
            provide: AiService,
            useValue: aiServiceMock,
          },

          {
            provide: ReportsService,
            useValue: reportsServiceMock,
          },

          {
            provide: EmailService,
            useValue: emailServiceMock,
          },
        ],
      }).compile();

    service =
      module.get<InterviewsService>(
        InterviewsService,
      );
  });

  // ---------------------------------
  // CREATE INTERVIEW
  // ---------------------------------

  describe('create()', () => {
    it('should create an interview and generate questions', async () => {
      const interview = {
        id: 'interview-1',
        role: 'Java Backend Developer',
        difficulty: 'Medium',
        status: 'PENDING',
        userId: 'user-1',
      };

      const questions = [
        {
          question: 'What is JVM?',
        },
        {
          question: 'What is Spring Boot?',
        },
      ];

      prismaMock.interview.create.mockResolvedValue(
        interview,
      );

      aiServiceMock.generateQuestions.mockResolvedValue(
        questions,
      );

      prismaMock.question.createMany.mockResolvedValue(
        {
          count: 2,
        },
      );

      prismaMock.interview.findUnique.mockResolvedValue(
        {
          ...interview,
          questions: [
            {
              id: 'q1',
              question: 'What is JVM?',
            },
            {
              id: 'q2',
              question:
                'What is Spring Boot?',
            },
          ],
        },
      );

      const result = await service.create(
        'user-1',
        {
          role: 'Java Backend Developer',
          difficulty: 'Medium',
        },
      );

      expect(
        prismaMock.interview.create,
      ).toHaveBeenCalled();

      expect(
        aiServiceMock.generateQuestions,
      ).toHaveBeenCalledWith(
        'Java Backend Developer',
        'Medium',
      );

      expect(
        prismaMock.question.createMany,
      ).toHaveBeenCalled();

      expect(result.id).toBe(
        'interview-1',
      );

      expect(
        result.questions.length,
      ).toBe(2);
    });
  });

  // ---------------------------------
  // START INTERVIEW
  // ---------------------------------

  describe('startInterview()', () => {
    it('should start a pending interview', async () => {
      const interview = {
        id: 'interview-1',
        userId: 'user-1',
        status: 'PENDING',
      };

      prismaMock.interview.findFirst.mockResolvedValue(
        interview,
      );

      prismaMock.interview.update.mockResolvedValue(
        {
          ...interview,
          status: 'IN_PROGRESS',
          duration: 30,
        },
      );

      const result =
        await service.startInterview(
          'interview-1',
          'user-1',
        );

      expect(
        prismaMock.interview.findFirst,
      ).toHaveBeenCalled();

      expect(
        prismaMock.interview.update,
      ).toHaveBeenCalled();

      expect(result.status).toBe(
        'IN_PROGRESS',
      );
    });

    it('should throw if interview does not exist', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.startInterview(
          'invalid-id',
          'user-1',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject already started interview', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        {
          id: 'interview-1',
          userId: 'user-1',
          status: 'IN_PROGRESS',
        },
      );

      await expect(
        service.startInterview(
          'interview-1',
          'user-1',
        ),
      ).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------
  // SUBMIT ANSWER
  // ---------------------------------

  describe('submitAnswer()', () => {
    it('should evaluate and save an answer', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        {
          id: 'interview-1',
          userId: 'user-1',
          status: 'IN_PROGRESS',
        },
      );

      prismaMock.question.findUnique.mockResolvedValue(
        {
          id: 'question-1',
          question: 'What is JVM?',
        },
      );

      aiServiceMock.evaluateAnswer.mockResolvedValue(
        {
          score: 8,
          feedback: 'Good answer',
          correctAnswer:
            'JVM executes Java bytecode.',
        },
      );

      prismaMock.question.update.mockResolvedValue(
        {
          id: 'question-1',
          question: 'What is JVM?',
          answer: 'JVM runs bytecode.',
          score: 8,
          feedback: 'Good answer',
          correctAnswer:
            'JVM executes Java bytecode.',
        },
      );

      const result =
        await service.submitAnswer(
          'interview-1',
          'question-1',
          'user-1',
          'JVM runs bytecode.',
        );

      expect(
        aiServiceMock.evaluateAnswer,
      ).toHaveBeenCalledWith(
        'What is JVM?',
        'JVM runs bytecode.',
      );

      expect(
        prismaMock.question.update,
      ).toHaveBeenCalled();

      expect(result.score).toBe(8);

      expect(result.feedback).toBe(
        'Good answer',
      );
    });

    it('should throw when interview does not exist', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.submitAnswer(
          'invalid-interview',
          'question-1',
          'user-1',
          'answer',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when question does not exist', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        {
          id: 'interview-1',
          userId: 'user-1',
        },
      );

      prismaMock.question.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.submitAnswer(
          'interview-1',
          'invalid-question',
          'user-1',
          'answer',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------
  // FINISH INTERVIEW
  // ---------------------------------

  describe('finishInterview()', () => {
    it('should complete interview and generate report', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        {
          id: 'interview-1',
          userId: 'user-1',
          role: 'Java Backend Developer',
          status: 'IN_PROGRESS',
          questions: [
            {
              id: 'q1',
              score: 8,
            },
            {
              id: 'q2',
              score: 6,
            },
          ],
        },
      );

      prismaMock.interview.update.mockResolvedValue(
        {
          id: 'interview-1',
          status: 'COMPLETED',
          averageScore: 7,
        },
      );

      reportsServiceMock.generateReport.mockResolvedValue(
        {
          message: 'Report generated',
        },
      );

      prismaMock.user.findUnique.mockResolvedValue(
        {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      );

      emailServiceMock.sendInterviewCompletedEmail.mockResolvedValue(
        undefined,
      );

      const result =
        await service.finishInterview(
          'interview-1',
          'user-1',
        );

      expect(
        prismaMock.interview.update,
      ).toHaveBeenCalled();

      expect(
        reportsServiceMock.generateReport,
      ).toHaveBeenCalledWith(
        'interview-1',
      );

      expect(
        emailServiceMock
          .sendInterviewCompletedEmail,
      ).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Java Backend Developer',
        7,
      );

      expect(result.averageScore).toBe(7);

      expect(
        result.message,
      ).toBe(
        'Interview completed successfully.',
      );
    });

    it('should throw when interview does not exist', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.finishInterview(
          'invalid-id',
          'user-1',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------
  // FIND ONE
  // ---------------------------------

  describe('findOne()', () => {
    it('should return an interview', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        {
          id: 'interview-1',
          userId: 'user-1',
          questions: [],
          report: null,
        },
      );

      const result =
        await service.findOne(
          'interview-1',
          'user-1',
        );

      expect(result.id).toBe(
        'interview-1',
      );
    });

    it('should throw when interview does not exist', async () => {
      prismaMock.interview.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(
          'invalid-id',
          'user-1',
        ),
      ).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});