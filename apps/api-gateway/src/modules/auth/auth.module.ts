import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [HttpModule, CacheModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthServiceClient,
    AuthGuard,
    AuthGuardWithFingerprint,
  ],
  exports: [AuthService],
})
export class AuthModule {}
