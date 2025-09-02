import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisInfrastructure {
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
