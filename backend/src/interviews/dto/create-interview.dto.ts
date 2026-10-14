import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInterviewDto {
  @ApiProperty({
    example: 'Java Backend Developer',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    example: 'Medium',
    enum: ['Easy', 'Medium', 'Hard'],
  })
  @IsString()
  @IsIn(['Easy', 'Medium', 'Hard'])
  difficulty: string;

  @ApiProperty({
    example: 'VOICE',
    enum: ['VOICE', 'TEXT'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['VOICE', 'TEXT'])
  mode?: string;
}