import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCache extends Redis {
  constructor() {
    super(process.env.REDIS_URL);
  }
  async setCacheIfNotExists(key: string, value: string, ttl: number) {
    if (!(await this.exists(key))) {
      await this.set(key, value, 'EX', ttl);
    }
    return await this.get(key);
  }
}
