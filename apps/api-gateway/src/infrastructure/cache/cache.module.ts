import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class CacheModule {}
