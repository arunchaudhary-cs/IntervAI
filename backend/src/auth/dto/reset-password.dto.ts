import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit password reset OTP code',
  })
  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 digits' })
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @IsNotEmpty()
  newPassword: string;
}
