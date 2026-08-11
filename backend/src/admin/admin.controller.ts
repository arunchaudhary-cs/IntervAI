import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
  })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get all users',
  })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('interviews')
  @ApiOperation({
    summary: 'Get all interviews',
  })
  getInterviews() {
    return this.adminService.getInterviews();
  }

  @Get('recent-users')
  @ApiOperation({
    summary: 'Get recently registered users',
  })
  getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({
    summary: 'Change a user role',
  })
  updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(
      userId,
      role,
    );
  }
}