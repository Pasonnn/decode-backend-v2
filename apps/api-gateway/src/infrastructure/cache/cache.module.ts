import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { RedisInfrastructure } from './redis.infrastructure';
import { RedisModule } from '@nestjs-modules/ioredis';

@Global()
@Module({
  imports: [
    ConfigModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URI'), // Use consistent naming
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RateLimitService, RedisInfrastructure],
  exports: [RateLimitService, RedisInfrastructure],
})
export class CacheModule {}
