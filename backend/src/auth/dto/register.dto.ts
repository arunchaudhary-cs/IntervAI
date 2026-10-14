import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Arun Chaudhary',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'arun@gmail.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Please enter a valid email address (e.g. name@domain.com)' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (minimum 6 characters)',
  })
  @MinLength(6)
  password: string;
}