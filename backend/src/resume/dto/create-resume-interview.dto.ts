import { IsIn, IsString } from 'class-validator';

export class CreateResumeInterviewDto {
  @IsString()
  @IsIn(['Easy', 'Medium', 'Hard'])
  difficulty!: string;
}