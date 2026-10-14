import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit email verification OTP',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  @IsNotEmpty()
  otp: string;
}
