import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    this.ai = new GoogleGenAI({
      apiKey,
    });

    console.log('✅ Gemini Initialized');
  }

  // ---------------------------------
  // Generate Interview Questions
  // ---------------------------------
  async generateQuestions(
    role: string,
    difficulty: string,
  ) {
    const prompt = `
Generate exactly 10 interview questions.

Role: ${role}

Difficulty: ${difficulty}

Return ONLY JSON.

Example:

[
  {
    "question":"What is JVM?"
  },
  {
    "question":"Explain Spring Boot."
  }
]

Do not return markdown.
`;

    try {
      const response =
        await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

      const text = response.text ?? '';

      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to generate interview questions.',
      );
    }
  }

  // ---------------------------------
  // Analyze Resume
  // ---------------------------------
  async analyzeResume(text: string) {
    const prompt = `
Analyze this resume.

Return ONLY JSON.

{
  "role":"",
  "skills":[],
  "projects":[],
  "strengths":[],
  "weaknesses":[],
  "summary":""
}

Resume:

${text}
`;

    try {
      const response =
        await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

      const text = response.text ?? '';

      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to analyze resume.',
      );
    }
  }

  // ---------------------------------
  // Generate Interview From Resume
  // ---------------------------------
  async generateInterviewFromResume(
  resume: string,
  difficulty: string,
) {
  const prompt = `
You are a Senior Technical Interviewer.

Read the resume below.

Identify the candidate's primary backend role.

Generate exactly 10 interview questions.

Difficulty:
${difficulty}

Return ONLY JSON.

{
  "role":"Java Backend Developer",
  "questions":[
    {
      "question":"Explain JVM."
    }
  ]
}

Resume:

${resume}
`;

  try {
    const response =
      await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

    console.log('========= GEMINI RESPONSE =========');
    console.log(response.text);

    const cleaned = (response.text ?? '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('========= CLEANED =========');
    console.log(cleaned);

    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error('========= GEMINI ERROR =========');
    console.error(error);

    throw error;
  }
}

  // ---------------------------------
  // Evaluate Candidate Answer
  // ---------------------------------
  async evaluateAnswer(
    question: string,
    answer: string,
  ) {
    const prompt = `
You are a Senior Java Interviewer.

Question:

${question}

Candidate Answer:

${answer}

Return ONLY JSON.

{
  "score":8,
  "feedback":"Good answer",
  "correctAnswer":"Correct explanation"
}
`;

    try {
      const response =
        await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

      const text = response.text ?? '';

      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to evaluate answer.',
      );
    }
  }
  async generateReport(prompt: string): Promise<string> {
  const response = await this.ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
  });

  const text = response.text ?? '';

  if (!text) {
    throw new InternalServerErrorException(
      'Failed to generate interview report.',
    );
  }

  return text;
}
}