import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // ---------------------------------
  // Dashboard
  // ---------------------------------

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Get authenticated user dashboard statistics',
  })
  getDashboard(@Request() req: any) {
    return this.usersService.getDashboard(
      req.user.userId,
    );
  }

  // ---------------------------------
  // Interview History
  // ---------------------------------

  @Get('interviews')
  @ApiOperation({
    summary:
      'Get paginated interview history',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'COMPLETED',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    example: 'Medium',
  })
  getInterviewHistory(
    @Request() req: any,

    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,

    @Query('status')
    status?: string,

    @Query('difficulty')
    difficulty?: string,
  ) {
    return this.usersService.getInterviewHistory(
      req.user.userId,
      Number(page) || 1,
      Number(limit) || 10,
      status,
      difficulty,
    );
  }
}