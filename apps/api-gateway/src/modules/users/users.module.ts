import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [UsersController],
  providers: [
    UserServiceClient,
    UsersService,
    AuthGuard,
    AuthGuardWithFingerprint,
  ],
  exports: [UserServiceClient, UsersService],
})
export class UsersModule {}
