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