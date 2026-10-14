import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshAuthGuard } from './refresh-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // ---------------------------------
  // Register
  // ---------------------------------

  @ApiOperation({
    summary: 'Register a new user',
  })
  @Post('register')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  // ---------------------------------
  // Verify Email
  // ---------------------------------

  @ApiOperation({
    summary: 'Verify user email with 6-digit OTP',
  })
  @Post('verify-email')
  @Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  })
  verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(
      verifyEmailDto,
    );
  }

  // ---------------------------------
  // Resend Verification Code
  // ---------------------------------

  @ApiOperation({
    summary: 'Resend email verification code',
  })
  @Post('resend-verification')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  resendVerification(
    @Body() resendDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(
      resendDto,
    );
  }

  // ---------------------------------
  // Forgot Password
  // ---------------------------------

  @ApiOperation({
    summary: 'Request password reset OTP code',
  })
  @Post('forgot-password')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto,
    );
  }

  // ---------------------------------
  // Reset Password
  // ---------------------------------

  @ApiOperation({
    summary: 'Reset password using OTP code',
  })
  @Post('reset-password')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto,
    );
  }

  // ---------------------------------
  // Login
  // ---------------------------------

  @ApiOperation({
    summary: 'Login user',
  })
  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  // ---------------------------------
  // Refresh Token
  // ---------------------------------

  @ApiOperation({
    summary: 'Refresh access token',
  })
  @ApiBearerAuth()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  // ---------------------------------
  // Logout
  // ---------------------------------

  @ApiOperation({
    summary: 'Logout user',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(
      req.user.userId,
    );
  }

  // ---------------------------------
  // Profile
  // ---------------------------------

  @ApiOperation({
    summary: 'Get authenticated user profile',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: any) {
    return {
      message: 'Authenticated',
      user: req.user,
    };
  }
}