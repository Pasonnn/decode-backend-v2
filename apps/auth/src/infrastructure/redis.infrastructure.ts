import { Injectable } from '@nestjs/common';
import { RedisService } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisInfrastructure {
    constructor(private readonly redisService: RedisService) {}

    async set(key: string, value: string, ttl: number) {
        await this.redisService.getClient().set(key, value, 'EX', ttl);
    }

    async get(key: string) {
        return await this.redisService.getClient().get(key);
    }
}