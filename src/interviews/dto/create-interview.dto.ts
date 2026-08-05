import { IsIn, IsNotEmpty, IsString } from 'class-validator';
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
}