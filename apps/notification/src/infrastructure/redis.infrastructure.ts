import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisInfrastructure {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  private readonly logger = new Logger(RedisInfrastructure.name);
  private readonly SOCKET_KEY_PREFIX = 'user_sockets:';

  /**
   * Add a socket ID to a user's socket list
   * @param userId - The user ID
   * @param socketId - The socket ID to add
   */
  async addUserSocket(userId: string, socketId: string): Promise<void> {
    try {
      const key = `${this.SOCKET_KEY_PREFIX}${userId}`;
      await this.redis.sadd(key, socketId);

      // Set expiration for the key (24 hours)
      await this.redis.expire(key, 86400);

      this.logger.log(`Added socket ${socketId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to add socket for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a socket ID from a user's socket list
   * @param userId - The user ID
   * @param socketId - The socket ID to remove
   */
  async removeUserSocket(userId: string, socketId: string): Promise<void> {
    try {
      const key = `${this.SOCKET_KEY_PREFIX}${userId}`;
      await this.redis.srem(key, socketId);

      this.logger.log(`Removed socket ${socketId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to remove socket for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all socket IDs for a user
   * @param userId - The user ID
   * @returns Array of socket IDs
   */
  async getUserSockets(userId: string): Promise<string[]> {
    try {
      const key = `${this.SOCKET_KEY_PREFIX}${userId}`;
      const sockets = await this.redis.smembers(key);

      this.logger.log(`Found ${sockets.length} sockets for user ${userId}`);
      return sockets;
    } catch (error) {
      this.logger.error(`Failed to get sockets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has any active sockets
   * @param userId - The user ID
   * @returns boolean indicating if user has active sockets
   */
  async hasUserSockets(userId: string): Promise<boolean> {
    try {
      const key = `${this.SOCKET_KEY_PREFIX}${userId}`;
      const count = await this.redis.scard(key);

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check sockets for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all users with active sockets
   * @returns Array of user IDs with active sockets
   */
  async getAllUsersWithSockets(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(`${this.SOCKET_KEY_PREFIX}*`);
      const userIds = keys.map((key) =>
        key.replace(this.SOCKET_KEY_PREFIX, ''),
      );

      this.logger.log(`Found ${userIds.length} users with active sockets`);
      return userIds;
    } catch (error) {
      this.logger.error('Failed to get users with sockets:', error);
      throw error;
    }
  }

  /**
   * Remove all sockets for a user (cleanup on disconnect)
   * @param userId - The user ID
   */
  async clearUserSockets(userId: string): Promise<void> {
    try {
      const key = `${this.SOCKET_KEY_PREFIX}${userId}`;
      await this.redis.del(key);

      this.logger.log(`Cleared all sockets for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear sockets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get total number of active sockets across all users
   * @returns Total number of active sockets
   */
  async getTotalActiveSockets(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.SOCKET_KEY_PREFIX}*`);
      let totalSockets = 0;

      for (const key of keys) {
        const count = await this.redis.scard(key);
        totalSockets += count;
      }

      return totalSockets;
    } catch (error) {
      this.logger.error('Failed to get total active sockets:', error);
      return 0;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.redis.setex(key, ttl, serializedValue);
    } else {
      await this.redis.set(key, serializedValue);
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.expire(key, ttl);
  }

  // async mget(keys: string[]): Promise<any[]> {
  //   const values = await this.redis.mget(...keys);
  //   return values.map((value) => {
  //     if (!value) return null;
  //     try {
  //       return JSON.parse(value);
  //     } catch {
  //       return value;
  //     }
  //   });
  // }

  async mdel(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Health check
  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  // Connection info
  async getConnectionInfo(): Promise<any> {
    const info = await this.redis.info();
    return info;
  }

  // Clear all data (use with caution)
  async flushAll(): Promise<void> {
    await this.redis.flushall();
  }

  // Clear specific database
  async flushDb(): Promise<void> {
    await this.redis.flushdb();
  }
}
