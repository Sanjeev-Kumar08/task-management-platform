import { request } from '@/lib/api';
import type { AuditLog, Task, Workspace, WorkspaceAnalytics, WorkspaceRole } from '@/types';

export function listWorkspaces() {
  return request<Workspace[]>({ method: 'GET', url: '/api/workspaces' });
}

export function getWorkspace(id: string) {
  return request<Workspace>({ method: 'GET', url: `/api/workspaces/${id}` });
}

export function createWorkspace(input: {
  name: string;
  slug?: string;
  description?: string;
  avatar?: string | null;
}) {
  return request<Workspace>({ method: 'POST', url: '/api/workspaces', data: input });
}

export function updateWorkspace(
  id: string,
  input: { name?: string; description?: string; avatar?: string | null },
) {
  return request<Workspace>({ method: 'PATCH', url: `/api/workspaces/${id}`, data: input });
}

export function deleteWorkspace(id: string) {
  return request<null>({ method: 'DELETE', url: `/api/workspaces/${id}` });
}

export function changeMemberRole(
  workspaceId: string,
  userId: string,
  role: Exclude<WorkspaceRole, 'OWNER'>,
) {
  return request<Workspace>({
    method: 'PATCH',
    url: `/api/workspaces/${workspaceId}/members/${userId}`,
    data: { role },
  });
}

export function removeMember(workspaceId: string, userId: string) {
  return request<Workspace>({
    method: 'DELETE',
    url: `/api/workspaces/${workspaceId}/members/${userId}`,
  });
}

export function leaveWorkspace(workspaceId: string) {
  return request<null>({ method: 'POST', url: `/api/workspaces/${workspaceId}/leave` });
}

export function transferOwnership(workspaceId: string, newOwnerId: string) {
  return request<Workspace>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/transfer-ownership`,
    data: { newOwnerId },
  });
}

export function getAnalytics(id: string) {
  return request<WorkspaceAnalytics>({ method: 'GET', url: `/api/workspaces/${id}/analytics` });
}

export function getActivity(id: string) {
  return request<AuditLog[]>({ method: 'GET', url: `/api/workspaces/${id}/activity` });
}

export function listWorkspaceTasks(id: string) {
  return request<Task[]>({ method: 'GET', url: `/api/workspaces/${id}/tasks` });
}
