import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'JVM is the Java Virtual Machine responsible for executing Java bytecode.',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;
}