import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';
import { RefreshStrategy } from './refresh.strategy';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (
        configService: ConfigService,
      ) => ({
        secret: configService.get<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    RefreshStrategy,
  ],

  exports: [AuthService],
})
export class AuthModule {}