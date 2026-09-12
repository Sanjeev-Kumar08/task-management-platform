import { request } from '@/lib/api';
import type { AuthSession, User } from '@/types';
import { normalizeId } from '@/utils/normalize';

export interface AuthPayload {
  user: User;
  accessToken: string;
}

export async function login(input: { email: string; password: string }): Promise<AuthPayload> {
  const data = await request<AuthPayload>({ method: 'POST', url: '/api/auth/login', data: input });
  return { ...data, user: normalizeId(data.user as User & { _id?: string }) };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const data = await request<AuthPayload>({
    method: 'POST',
    url: '/api/auth/register',
    data: input,
  });
  return { ...data, user: normalizeId(data.user as User & { _id?: string }) };
}

export async function logout(): Promise<void> {
  await request<null>({ method: 'POST', url: '/api/auth/logout' });
}

export async function me(): Promise<User> {
  const data = await request<User>({ method: 'GET', url: '/api/auth/me' });
  return normalizeId(data as User & { _id?: string });
}

export async function updateProfile(input: {
  name?: string;
  avatar?: string | null;
}): Promise<User> {
  const data = await request<User>({ method: 'PATCH', url: '/api/auth/profile', data: input });
  return normalizeId(data as User & { _id?: string });
}

export async function forgotPassword(email: string): Promise<void> {
  await request<null>({ method: 'POST', url: '/api/auth/forgot-password', data: { email } });
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await request<null>({ method: 'POST', url: '/api/auth/reset-password', data: input });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await request<null>({ method: 'POST', url: '/api/auth/change-password', data: input });
}

export async function listSessions(): Promise<AuthSession[]> {
  return request<AuthSession[]>({ method: 'GET', url: '/api/auth/sessions' });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await request<null>({ method: 'DELETE', url: `/api/auth/sessions/${sessionId}` });
}

export async function deleteAccount(): Promise<void> {
  await request<null>({ method: 'DELETE', url: '/api/auth/account' });
}
