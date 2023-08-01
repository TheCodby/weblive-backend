import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCache extends Redis {
  constructor() {
    super(process.env.REDIS_URL);
  }
  async getCache(key: string) {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }
  async setCache(key: string, value: any) {
    return await this.set(key, JSON.stringify(value));
  }
  async deleteCache(key: string) {
    return await this.del(key);
  }
  async clearCache() {
    return await this.flushdb();
  }
}
