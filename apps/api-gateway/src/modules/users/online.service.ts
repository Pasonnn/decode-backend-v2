import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class OnlineService {
  private readonly logger = new Logger(OnlineService.name);
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  /**
   * Checks if user is online by verifying existence of their sockets in Redis.
   * @param userId - the user id to check
   * @returns Promise<boolean> - true if online, false if not
   */
  async isOnline(userId: string): Promise<boolean> {
    try {
      const key = `user_sockets:${userId}`;
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check if user is online: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
