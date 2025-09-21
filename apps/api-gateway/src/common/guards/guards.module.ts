import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { AuthGuard } from './auth.guard';
import { AuthGuardWithFingerprint } from './auth-with-fingerprint.guard';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    RateLimitGuard,
    AuthGuard,
    AuthGuardWithFingerprint,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [RateLimitGuard, AuthGuard, AuthGuardWithFingerprint],
})
export class GuardsModule {}
