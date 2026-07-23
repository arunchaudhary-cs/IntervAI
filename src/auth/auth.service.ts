import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getWelcomeMessage() {
    return {
      message: 'Welcome to IntervAI Authentication API',
    };
  }
}