import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: string, ttl?: number): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  quit(): Promise<'OK'>;
  on(event: string, cb: (...args: unknown[]) => void): void;
};

class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ex?: string, ttl?: number): Promise<'OK'> {
    const expiresAt = ex === 'EX' && typeof ttl === 'number' ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  on(): void {
    // no-op
  }
}

let redis: RedisLike | null = null;

export function getRedis(): RedisLike {
  if (!redis) {
    if (env.isTest) {
      redis = new MemoryRedis();
      return redis;
    }
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err: Error) => logger.error({ err }, 'Redis error'));
    redis = client as unknown as RedisLike;
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
