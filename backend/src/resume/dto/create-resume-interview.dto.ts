import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateResumeInterviewDto {
  @IsString()
  @IsIn(['Easy', 'Medium', 'Hard'])
  difficulty!: string;

  @IsOptional()
  @IsString()
  @IsIn(['VOICE', 'TEXT'])
  mode?: string;
}