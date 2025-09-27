import { Injectable, Logger } from '@nestjs/common';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { RedisInfrastructure } from './redis.infrastructure';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  constructor(private readonly redisInfrastructure: RedisInfrastructure) {}

  async userData(input: { user_id: string; data: UserDoc }): Promise<void> {
    try {
      const { user_id, data } = input;
      const key = `user:${user_id}`;
      await this.redisInfrastructure.set(key, data, 60 * 5); // 5 mins
      this.logger.log(`User data set in cache for user: ${user_id}`);
    } catch (error) {
      this.logger.error(
        `Error setting user data in cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getUserData(input: { user_id: string }): Promise<UserDoc | null> {
    try {
      const { user_id } = input;
      const key = `user:${user_id}`;
      const data = (await this.redisInfrastructure.get(key)) as UserDoc;
      if (!data) {
        return null;
      }
      this.logger.log(`User data fetched from cache for user: ${user_id}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Error getting user data from cache: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async userChangedData(input: { user_id: string }): Promise<void> {
    try {
      const { user_id } = input;
      const key = `user:${user_id}`;
      await this.redisInfrastructure.del(key);
      this.logger.log(`User data deleted from cache for user: ${user_id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting user data from cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
