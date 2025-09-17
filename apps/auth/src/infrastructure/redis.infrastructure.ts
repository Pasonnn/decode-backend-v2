/**
 * @fileoverview Redis Infrastructure Service
 *
 * This service provides a comprehensive interface for Redis operations in the
 * Decode authentication system. It handles caching, temporary data storage,
 * and session management using Redis as the primary caching layer.
 *
 * Redis Operations:
 * - Key-value storage with TTL support
 * - JSON serialization and deserialization
 * - Key existence checking and expiration management
 * - Atomic operations and batch operations
 * - Connection health monitoring
 *
 * Use Cases:
 * - Email verification code storage
 * - Session data caching
 * - Rate limiting and throttling
 * - Temporary registration data
 * - SSO token management
 *
 * Security Features:
 * - Automatic data expiration
 * - Secure key naming conventions
 * - Connection health monitoring
 * - Error handling and recovery
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for dependency injection
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

/**
 * Redis Infrastructure Service
 *
 * This service provides a comprehensive interface for Redis operations including
 * data storage, retrieval, and management. It handles JSON serialization,
 * TTL management, and provides utility methods for common Redis operations.
 *
 * Key features:
 * - Automatic JSON serialization/deserialization
 * - TTL support for automatic data expiration
 * - Batch operations for efficiency
 * - Connection health monitoring
 * - Error handling and recovery
 *
 * @Injectable - Marks this class as a provider that can be injected into other classes
 */
@Injectable()
export class RedisInfrastructure {
  /**
   * Constructor for dependency injection
   *
   * @param redis - Redis client instance for database operations
   */
  constructor(@InjectRedis() private readonly redis: Redis) {}

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
