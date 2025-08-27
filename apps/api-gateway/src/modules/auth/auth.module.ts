import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CacheModule } from '../../infrastructure/cache/cache.module';

@Module({
    imports: [HttpModule, CacheModule],
    controllers: [AuthController],
    providers: [AuthService, AuthServiceClient, RateLimitGuard],
    exports: [AuthService],
})
export class AuthModule {}
