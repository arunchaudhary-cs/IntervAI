import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      10,
    );

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    try {
      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email.toLowerCase().trim(),
          password: hashedPassword,
          isEmailVerified: false,
          emailVerificationToken: otp,
          emailVerificationExpires: expiresAt,
        },
      });

      // Send verification email
      await this.emailService.sendVerificationOtp(
        user.email,
        user.name,
        otp,
      );

      const { password, hashedRefreshToken, emailVerificationToken, ...result } =
        user;

      return {
        ...result,
        requiresVerification: true,
        message:
          'Registration successful! We have sent a 6-digit verification code to your email.',
        // included for dev convenience
        devOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Email already exists. Please log in or use a different email.',
        );
      }

      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found with this email');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified. You can proceed to login.',
        alreadyVerified: true,
      };
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== dto.otp) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    if (
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new code.',
      );
    }

    // Mark email as verified and clear OTP
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Automatically issue login tokens upon verification
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: updatedUser.id },
      data: { hashedRefreshToken },
    });

    return {
      message: 'Email verified successfully! Welcome to IntervAI.',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email.');
    }

    if (user.isEmailVerified) {
      return {
        message: 'This email is already verified. You can log in.',
        alreadyVerified: true,
      };
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: otp,
        emailVerificationExpires: expiresAt,
      },
    });

    await this.emailService.sendVerificationOtp(user.email, user.name, otp);

    return {
      message: 'A fresh verification code has been sent to your email.',
      devOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Do not reveal if user does not exist for security
      return {
        message:
          'If an account with this email exists, a password reset code has been sent.',
      };
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: otp,
        passwordResetExpires: expiresAt,
      },
    });

    await this.emailService.sendPasswordResetOtp(user.email, user.name, otp);

    return {
      message:
        'If an account with this email exists, a password reset code has been sent.',
      devOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or reset code.');
    }

    if (!user.passwordResetToken || user.passwordResetToken !== dto.otp) {
      throw new BadRequestException('Invalid password reset code.');
    }

    if (
      user.passwordResetExpires &&
      new Date() > user.passwordResetExpires
    ) {
      throw new BadRequestException(
        'Password reset code has expired. Please request a new one.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        hashedRefreshToken: null, // Invalidate existing sessions
      },
    });

    return {
      message:
        'Password reset successfully! You can now log in with your new password.',
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // Enforce email verification check
    if (!user.isEmailVerified) {
      // Auto-refresh OTP if needed
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: otp,
          emailVerificationExpires: expiresAt,
        },
      });

      await this.emailService.sendVerificationOtp(user.email, user.name, otp);

      throw new BadRequestException({
        message:
          'Your email is not verified yet. We have sent a new verification code to your email.',
        emailNotVerified: true,
        email: user.email,
        devOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });

    const refreshToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      });

    const hashedRefreshToken =
      await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        hashedRefreshToken,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    const matches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!matches) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });

    const newRefreshToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      });

    const newHashed =
      await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        hashedRefreshToken: newHashed,
      },
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: null,
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }
}