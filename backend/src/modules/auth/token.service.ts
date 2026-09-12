import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { getRedis } from '../../db/redis.js';
import { UnauthorizedError } from '../../utils/errors.js';

const REFRESH_PREFIX = 'auth:refresh:';
const USER_SESSIONS_PREFIX = 'auth:user_sessions:';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

interface SessionMeta {
  userId: string;
  createdAt: string;
  userAgent?: string;
  rotatedFrom?: string;
}

async function trackUserSession(userId: string, sessionId: string): Promise<void> {
  const redis = getRedis();
  await redis.sadd(`${USER_SESSIONS_PREFIX}${userId}`, sessionId);
  await redis.expire(`${USER_SESSIONS_PREFIX}${userId}`, REFRESH_TTL_SECONDS);
}

async function untrackUserSession(userId: string, sessionId: string): Promise<void> {
  await getRedis().srem(`${USER_SESSIONS_PREFIX}${userId}`, sessionId);
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const redis = getRedis();
  const key = `${USER_SESSIONS_PREFIX}${userId}`;
  const sids = await redis.smembers(key);
  if (sids.length) {
    const pipeline = redis.pipeline();
    for (const sid of sids) pipeline.del(`${REFRESH_PREFIX}${sid}`);
    pipeline.del(key);
    await pipeline.exec();
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export async function createRefreshSession(
  userId: string,
  userAgent?: string,
): Promise<{ token: string; sessionId: string }> {
  const sessionId = uuidv4();
  const token = jwt.sign(
    { sub: userId, sid: sessionId, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );

  const meta: SessionMeta = { userId, createdAt: new Date().toISOString(), userAgent };
  await getRedis().set(
    `${REFRESH_PREFIX}${sessionId}`,
    JSON.stringify(meta),
    'EX',
    REFRESH_TTL_SECONDS,
  );
  await trackUserSession(userId, sessionId);

  return { token, sessionId };
}

export async function rotateRefreshSession(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
}> {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const redis = getRedis();
  const key = `${REFRESH_PREFIX}${payload.sid}`;
  const raw = await redis.get(key);

  if (!raw) {
    await invalidateAllUserSessions(payload.sub);
    throw new UnauthorizedError('Refresh session expired or reused');
  }

  const meta = JSON.parse(raw) as SessionMeta;
  if (meta.userId !== payload.sub) {
    throw new UnauthorizedError('Refresh session mismatch');
  }

  await redis.del(key);
  await untrackUserSession(payload.sub, payload.sid);

  const { token: newRefresh, sessionId } = await createRefreshSession(payload.sub, meta.userAgent);
  await redis.set(
    `${REFRESH_PREFIX}${sessionId}`,
    JSON.stringify({
      userId: payload.sub,
      createdAt: new Date().toISOString(),
      userAgent: meta.userAgent,
      rotatedFrom: payload.sid,
    } satisfies SessionMeta),
    'EX',
    REFRESH_TTL_SECONDS,
  );

  return { accessToken: '', refreshToken: newRefresh, userId: payload.sub };
}

export async function invalidateRefreshSession(refreshToken: string): Promise<void> {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    await getRedis().del(`${REFRESH_PREFIX}${payload.sid}`);
    await untrackUserSession(payload.sub, payload.sid);
  } catch {
    // ignore invalid token on logout
  }
}

export async function listUserSessions(userId: string): Promise<
  Array<{ sessionId: string; createdAt: string; userAgent?: string }>
> {
  const redis = getRedis();
  const sids = await redis.smembers(`${USER_SESSIONS_PREFIX}${userId}`);
  const sessions: Array<{ sessionId: string; createdAt: string; userAgent?: string }> = [];
  for (const sid of sids) {
    const raw = await redis.get(`${REFRESH_PREFIX}${sid}`);
    if (!raw) {
      await untrackUserSession(userId, sid);
      continue;
    }
    const meta = JSON.parse(raw) as SessionMeta;
    sessions.push({ sessionId: sid, createdAt: meta.createdAt, userAgent: meta.userAgent });
  }
  return sessions;
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<void> {
  const redis = getRedis();
  const raw = await redis.get(`${REFRESH_PREFIX}${sessionId}`);
  if (!raw) return;
  const meta = JSON.parse(raw) as SessionMeta;
  if (meta.userId !== userId) throw new UnauthorizedError('Session does not belong to user');
  await redis.del(`${REFRESH_PREFIX}${sessionId}`);
  await untrackUserSession(userId, sessionId);
}

export async function cleanupExpiredSessions(): Promise<number> {
  return 0;
}
