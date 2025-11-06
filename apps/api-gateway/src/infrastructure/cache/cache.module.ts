import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { RedisInfrastructure } from './redis.infrastructure';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MetricsModule } from '../../common/datadog/metrics.module';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MetricsModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URI'), // Use consistent naming
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RateLimitService, RedisInfrastructure, CacheService],
  exports: [RateLimitService, RedisInfrastructure, CacheService],
})
export class CacheModule {}
