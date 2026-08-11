import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      10,
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
        },
      });

      const { password, hashedRefreshToken, ...result } =
        user;

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Email already exists',
        );
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
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