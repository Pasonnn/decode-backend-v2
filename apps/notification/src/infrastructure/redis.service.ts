import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Redis service for managing WebSocket connections
 * Stores user socket mappings in Redis for scalability
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly SOCKET_KEY_PREFIX = 'user_sockets:';

  constructor(@InjectRedis() private readonly redis: Redis) {}

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
}
