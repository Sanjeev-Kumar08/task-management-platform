import { request } from '@/lib/api';
import type { Channel } from '@/types';

export function listChannels(workspaceId: string) {
  return request<Channel[]>({ method: 'GET', url: `/api/workspaces/${workspaceId}/channels` });
}
