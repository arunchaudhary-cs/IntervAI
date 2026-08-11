import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai/ai.service';

@Controller()
export class AppController {
  constructor(private readonly aiService: AiService) {}

  @Get('test-ai')
  async testAI() {
    return this.aiService.generateQuestions(
      'Java Backend Developer',
      'Medium',
    );
  }
}