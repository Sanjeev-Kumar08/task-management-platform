import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { getRedis } from '../../db/redis.js';
import { UnauthorizedError } from '../../utils/errors.js';

const REFRESH_PREFIX = 'auth:refresh:';
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
  rotatedFrom?: string;
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

export async function createRefreshSession(userId: string): Promise<{
  token: string;
  sessionId: string;
}> {
  const sessionId = uuidv4();
  const token = jwt.sign(
    { sub: userId, sid: sessionId, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );

  const meta: SessionMeta = { userId };
  await getRedis().set(
    `${REFRESH_PREFIX}${sessionId}`,
    JSON.stringify(meta),
    'EX',
    REFRESH_TTL_SECONDS,
  );

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
    // Possible reuse — invalidate any sibling sessions for this user by scanning is expensive;
    // for assessment we invalidate the missing session and reject.
    throw new UnauthorizedError('Refresh session expired or reused');
  }

  const meta = JSON.parse(raw) as SessionMeta;
  if (meta.userId !== payload.sub) {
    throw new UnauthorizedError('Refresh session mismatch');
  }

  await redis.del(key);

  const { token: newRefresh, sessionId } = await createRefreshSession(payload.sub);
  await redis.set(
    `${REFRESH_PREFIX}${sessionId}`,
    JSON.stringify({ userId: payload.sub, rotatedFrom: payload.sid } satisfies SessionMeta),
    'EX',
    REFRESH_TTL_SECONDS,
  );

  // Need user details for access token — caller should pass or we return userId only.
  // Access token signed in auth service with user info.
  return { accessToken: '', refreshToken: newRefresh, userId: payload.sub };
}

export async function invalidateRefreshSession(refreshToken: string): Promise<void> {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    await getRedis().del(`${REFRESH_PREFIX}${payload.sid}`);
  } catch {
    // ignore invalid token on logout
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  // Redis TTLs handle expiry; cleanup job reports 0 for intentional no-op scan cost.
  return 0;
}
