import { request } from '@/lib/api';
import type { Message, MessagePage } from '@/types';

export function listMessages(
  channelId: string,
  opts?: { limit?: number; before?: string; parentMessageId?: string | null },
) {
  return request<MessagePage>({
    method: 'GET',
    url: `/api/channels/${channelId}/messages`,
    params: {
      limit: opts?.limit,
      before: opts?.before,
      parentMessageId: opts?.parentMessageId,
    },
  });
}

export function sendMessage(
  channelId: string,
  content: string,
  parentMessageId?: string | null,
) {
  return request<Message>({
    method: 'POST',
    url: `/api/channels/${channelId}/messages`,
    data: { content, parentMessageId: parentMessageId ?? null },
  });
}

export function updateMessage(messageId: string, content: string) {
  return request<Message>({
    method: 'PATCH',
    url: `/api/messages/${messageId}`,
    data: { content },
  });
}

export function deleteMessage(messageId: string) {
  return request<null>({ method: 'DELETE', url: `/api/messages/${messageId}` });
}
