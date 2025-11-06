import { Injectable, Logger } from '@nestjs/common';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { RedisInfrastructure } from './redis.infrastructure';
import { MetricsService } from '../../common/datadog/metrics.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  constructor(
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly metricsService?: MetricsService,
  ) {}

  async userData(input: { user_id: string; data: UserDoc }): Promise<void> {
    const startTime = Date.now();
    try {
      const { user_id, data } = input;
      const key = `user:${user_id}`;
      await this.redisInfrastructure.set(key, data, 60 * 5); // 5 mins

      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'set',
        key_pattern: 'user:*',
      });
      this.metricsService?.increment('cache.write', 1, {
        key_pattern: 'user:*',
      });

      this.logger.log(`User data set in cache for user: ${user_id}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'set',
        key_pattern: 'user:*',
        error: 'true',
      });
      this.logger.error(
        `Error setting user data in cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getUserData(input: { user_id: string }): Promise<UserDoc | null> {
    const startTime = Date.now();
    try {
      const { user_id } = input;
      const key = `user:${user_id}`;
      const data = (await this.redisInfrastructure.get(key)) as UserDoc;

      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'get',
        key_pattern: 'user:*',
      });

      if (!data) {
        this.metricsService?.increment('cache.misses', 1, {
          key_pattern: 'user:*',
        });
        return null;
      }

      this.metricsService?.increment('cache.hits', 1, {
        key_pattern: 'user:*',
      });

      this.logger.log(`User data fetched from cache for user: ${user_id}`);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'get',
        key_pattern: 'user:*',
        error: 'true',
      });
      this.metricsService?.increment('cache.misses', 1, {
        key_pattern: 'user:*',
      });
      this.logger.error(
        `Error getting user data from cache: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async userChangedData(input: { user_id: string }): Promise<void> {
    const startTime = Date.now();
    try {
      const { user_id } = input;
      const key = `user:${user_id}`;
      await this.redisInfrastructure.del(key);

      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'delete',
        key_pattern: 'user:*',
      });
      this.metricsService?.increment('cache.delete', 1, {
        key_pattern: 'user:*',
      });

      this.logger.log(`User data deleted from cache for user: ${user_id}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('cache.operation.duration', duration, {
        operation: 'delete',
        key_pattern: 'user:*',
        error: 'true',
      });
      this.logger.error(
        `Error deleting user data from cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
