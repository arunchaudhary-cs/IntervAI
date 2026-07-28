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
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
        },
      });

      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists');
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare entered password with hashed password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // JWT Payload
    const payload = {
      sub: user.id,
      email: user.email,
    };

    // Generate JWT
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}