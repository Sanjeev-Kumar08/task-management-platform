import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

type RedisPipeline = {
  del(key: string): RedisPipeline;
  exec(): Promise<unknown>;
};

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: string, ttl?: number): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  pipeline(): RedisPipeline;
  ping(): Promise<string>;
  quit(): Promise<'OK'>;
  on(event: string, cb: (...args: unknown[]) => void): void;
};

class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private sets = new Map<string, Set<string>>();

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
    const a = this.store.delete(key) ? 1 : 0;
    const b = this.sets.delete(key) ? 1 : 0;
    return a || b;
  }

  async sadd(key: string, member: string): Promise<number> {
    const set = this.sets.get(key) ?? new Set<string>();
    const before = set.size;
    set.add(member);
    this.sets.set(key, set);
    return set.size > before ? 1 : 0;
  }

  async srem(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    return set.delete(member) ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    return [...(this.sets.get(key) ?? new Set<string>())];
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
      this.store.set(key, entry);
      return 1;
    }
    if (this.sets.has(key)) return 1;
    return 0;
  }

  pipeline(): RedisPipeline {
    const ops: Array<() => Promise<unknown>> = [];
    const api: RedisPipeline = {
      del: (key: string) => {
        ops.push(() => this.del(key));
        return api;
      },
      exec: async () => {
        for (const op of ops) await op();
        return [];
      },
    };
    return api;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    this.sets.clear();
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
