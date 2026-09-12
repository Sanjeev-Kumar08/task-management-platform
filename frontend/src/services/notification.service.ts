import { request } from '@/lib/api';
import type { NotificationPage } from '@/types';

export function listNotifications(page = 1, limit = 20) {
  return request<NotificationPage>({
    method: 'GET',
    url: '/api/notifications',
    params: { page, limit },
  });
}

export function markRead(id: string) {
  return request({ method: 'PATCH', url: `/api/notifications/${id}/read` });
}

export function markAllRead() {
  return request({ method: 'PATCH', url: '/api/notifications/read-all' });
}
