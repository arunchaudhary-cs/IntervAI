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

    const totalQuestions = interview.questions.length;
    const answeredQuestions = interview.questions.filter(
      (q) => q.answer && q.answer.trim().length > 0,
    );
    const attemptedCount = answeredQuestions.length;
    const skippedCount = totalQuestions - attemptedCount;

    const formattedQA = interview.questions.map((q, idx) => ({
      index: idx + 1,
      question: q.question,
      candidateAnswer: q.answer || '(Question was skipped / not attempted)',
      score: q.score ?? (q.answer ? 0 : 0),
      evaluatedFeedback: q.feedback || '(Not evaluated)',
    }));

    const prompt = `
You are a Senior Technical Interviewer and Hiring Evaluator.

Analyze this candidate's technical interview performance.
Note: Some candidates may submit partial attempts (they answered ${attemptedCount} out of ${totalQuestions} questions; ${skippedCount} skipped).

Role:
${interview.role}

Difficulty:
${interview.difficulty}

Questions and Candidate Responses:
${JSON.stringify(formattedQA, null, 2)}

Provide an insightful, balanced, and actionable candidate evaluation report.
If questions were skipped, highlight those technical areas as key gaps in weaknesses and improvements.

Return ONLY a valid JSON object in this format (no markdown backticks):
{
  "overallScore": ${Math.round(interview.averageScore || 0)},
  "strengths": "Key technical competencies, strong explanations, and effective communication demonstrated.",
  "weaknesses": "Technical gaps, missing depth in explanations, or skipped question topics.",
  "feedback": "Comprehensive assessment of the candidate's technical readiness and domain knowledge.",
  "improvements": "Clear, actionable recommendations to improve before real-world job interviews."
}
`;

    try {
      const response =
        await this.aiService.generateReport(prompt);

      const cleaned = response
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned);

      const report = {
        overallScore: Math.round(
          typeof parsed.overallScore === 'number'
            ? parsed.overallScore
            : (interview.averageScore ?? 0),
        ),
        strengths:
          parsed.strengths ||
          'Demonstrated understanding of core domain fundamentals in attempted questions.',
        weaknesses:
          parsed.weaknesses ||
          (skippedCount > 0
            ? `${skippedCount} questions were skipped; further depth needed in those areas.`
            : 'Could provide deeper real-world trade-off explanations.'),
        feedback:
          parsed.feedback ||
          'Overall decent effort. Continue building proficiency and practicing technical communication.',
        improvements:
          parsed.improvements ||
          'Review advanced architectural concepts and practice mock voice interviews.',
      };

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
      console.error('Error generating AI report, falling back to structured summary:', error);

      // Safe fallback report so the candidate can always view results
      const fallbackReport = {
        overallScore: Math.round(interview.averageScore || 0),
        strengths: `Attempted ${attemptedCount} of ${totalQuestions} technical questions for the ${interview.role} position.`,
        weaknesses:
          skippedCount > 0
            ? `${skippedCount} questions remained unanswered during this session.`
            : 'Answers could be expanded with more edge-case considerations.',
        feedback:
          'Interview completed. Review individual question scores and feedback below to identify targeted areas for practice.',
        improvements:
          'Focus on full question coverage, structuring answers using the STAR method, and clarifying technical tradeoffs.',
      };

      return this.prisma.interviewReport.upsert({
        where: { interviewId },
        update: fallbackReport,
        create: {
          interviewId,
          ...fallbackReport,
        },
      });
    }
  }
}