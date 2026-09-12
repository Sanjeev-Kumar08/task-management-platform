import { getRedis } from '../../db/redis.js';

const TTL = 60;

export function analyticsCacheKey(workspaceId: string): string {
  return `workspace:analytics:${workspaceId}`;
}

export async function getCachedAnalytics<T>(workspaceId: string): Promise<T | null> {
  const raw = await getRedis().get(analyticsCacheKey(workspaceId));
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setCachedAnalytics(workspaceId: string, data: unknown): Promise<void> {
  await getRedis().set(analyticsCacheKey(workspaceId), JSON.stringify(data), 'EX', TTL);
}

export async function invalidateAnalyticsCache(workspaceId: string): Promise<void> {
  await getRedis().del(analyticsCacheKey(workspaceId));
}
