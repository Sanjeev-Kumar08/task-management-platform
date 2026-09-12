import { request } from '@/lib/api';
import type { Channel, ChannelType } from '@/types';

export function listChannels(workspaceId: string) {
  return request<Channel[]>({ method: 'GET', url: `/api/workspaces/${workspaceId}/channels` });
}

export function createChannel(
  workspaceId: string,
  input: { name: string; type?: ChannelType; memberIds?: string[] },
) {
  return request<Channel>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/channels`,
    data: input,
  });
}

export function updateChannel(
  workspaceId: string,
  channelId: string,
  input: { name?: string; archived?: boolean },
) {
  return request<Channel>({
    method: 'PATCH',
    url: `/api/workspaces/${workspaceId}/channels/${channelId}`,
    data: input,
  });
}

export function archiveChannel(workspaceId: string, channelId: string) {
  return request<Channel>({
    method: 'DELETE',
    url: `/api/workspaces/${workspaceId}/channels/${channelId}`,
  });
}

export function markChannelRead(workspaceId: string, channelId: string) {
  return request<{ read: boolean }>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/channels/${channelId}/read`,
  });
}
