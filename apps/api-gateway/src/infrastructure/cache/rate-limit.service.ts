import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MetricsService } from '../../common/datadog/metrics.service';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetTime: Date;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService?: MetricsService,
  ) {
    // Use REDIS_URI like other services for consistency
    const redisUri = this.configService.get<string>('REDIS_URI');

    // Fallback to individual config if REDIS_URI is not available
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const redisConfig = this.configService.get('environment.redis');

    if (redisUri) {
      // Use REDIS_URI (preferred method)
      this.redis = new Redis(redisUri, {
        maxRetriesPerRequest: 3,
      });
    } else {
      // Fallback to individual config parameters
      this.redis = new Redis({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        host: redisConfig?.host as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        port: redisConfig?.port as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        password: redisConfig?.password as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        db: redisConfig?.db as number,
        maxRetriesPerRequest: 3,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.keyPrefix = redisConfig?.keyPrefix as string;

    this.redis.on('error', (error) => {
      this.logger.error(
        `Redis connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis for rate limiting');
    });
  }

  /**
   * Check if a request is allowed based on rate limiting rules
   */
  async isAllowed(
    key: string,
    windowMs: number,
    maxRequests: number,
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const fullKey = `${this.keyPrefix}${key}`;
    const currentTime = Date.now();
    const windowStart = currentTime - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove expired entries (older than window)
      pipeline.zremrangebyscore(fullKey, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(fullKey);

      // Add current request timestamp
      pipeline.zadd(fullKey, currentTime, currentTime.toString());

      // Set expiry on the key
      pipeline.expire(fullKey, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const currentCount = results[1][1] as number;
      const allowed = currentCount < maxRequests;

      const resetTime = new Date(currentTime + windowMs);
      const remaining = Math.max(0, maxRequests - currentCount - 1);

      const info: RateLimitInfo = {
        limit: maxRequests,
        remaining,
        reset: Math.floor(resetTime.getTime() / 1000),
        resetTime,
      };

      // Record rate limit metrics
      this.metricsService?.increment('rate_limit.checked', 1, {
        endpoint: key,
        result: allowed ? 'allowed' : 'denied',
      });

      if (!allowed) {
        this.metricsService?.increment('rate_limit.exceeded', 1, {
          endpoint: key,
          key_type: key.includes('user:')
            ? 'user'
            : key.includes('ip:')
              ? 'ip'
              : 'other',
        });
      } else {
        this.metricsService?.gauge('rate_limit.remaining', remaining, {
          endpoint: key,
        });
      }

      return { allowed, info };
    } catch (error) {
      this.logger.error(
        `Rate limiting error for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        info: {
          limit: maxRequests,
          remaining: maxRequests - 1,
          reset: Math.floor((currentTime + windowMs) / 1000),
          resetTime: new Date(currentTime + windowMs),
        },
      };
    }
  }

  /**
   * Get current rate limit info without incrementing
   */
  async getInfo(
    key: string,
    windowMs: number,
    maxRequests: number,
  ): Promise<RateLimitInfo> {
    const fullKey = `${this.keyPrefix}${key}`;
    const currentTime = Date.now();
    const windowStart = currentTime - windowMs;

    try {
      // Remove expired entries
      await this.redis.zremrangebyscore(fullKey, 0, windowStart);

      // Count current requests
      const currentCount = await this.redis.zcard(fullKey);

      const resetTime = new Date(currentTime + windowMs);
      const remaining = Math.max(0, maxRequests - currentCount);

      return {
        limit: maxRequests,
        remaining,
        reset: Math.floor(resetTime.getTime() / 1000),
        resetTime,
      };
    } catch (error) {
      this.logger.error(
        `Get rate limit info error for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        limit: maxRequests,
        remaining: maxRequests,
        reset: Math.floor((currentTime + windowMs) / 1000),
        resetTime: new Date(currentTime + windowMs),
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      await this.redis.del(fullKey);
      this.logger.log(`Rate limit reset for key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Reset rate limit error for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get all rate limit keys (for monitoring)
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      return keys.map((key) => key.replace(this.keyPrefix, ''));
    } catch (error) {
      this.logger.error(
        `Get all keys error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get rate limit statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    connected: boolean;
  }> {
    try {
      const totalKeys = await this.redis.dbsize();
      const connected = this.redis.status === 'ready';

      return {
        totalKeys,
        memoryUsage: 0, // Simplified for now
        connected,
      };
    } catch (error) {
      this.logger.error(
        `Get stats error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        totalKeys: 0,
        memoryUsage: 0,
        connected: false,
      };
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  async cleanup(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Key has no expiry, remove it
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
      return cleanedCount;
    } catch (error) {
      this.logger.error(
        `Cleanup error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  /**
   * Close Redis connection
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
