import { request } from '@/lib/api';
import type { Message } from '@/types';

export function listMessages(channelId: string) {
  return request<Message[]>({ method: 'GET', url: `/api/channels/${channelId}/messages` });
}

export function sendMessage(channelId: string, content: string) {
  return request<Message>({
    method: 'POST',
    url: `/api/channels/${channelId}/messages`,
    data: { content },
  });
}
