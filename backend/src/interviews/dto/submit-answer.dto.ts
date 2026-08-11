import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  answer: string;
}