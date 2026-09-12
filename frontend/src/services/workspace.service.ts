import { request } from '@/lib/api';
import type { AuditLog, Workspace, WorkspaceAnalytics } from '@/types';

export function listWorkspaces() {
  return request<Workspace[]>({ method: 'GET', url: '/api/workspaces' });
}

export function getWorkspace(id: string) {
  return request<Workspace>({ method: 'GET', url: `/api/workspaces/${id}` });
}

export function createWorkspace(input: { name: string; slug?: string }) {
  return request<Workspace>({ method: 'POST', url: '/api/workspaces', data: input });
}

export function getAnalytics(id: string) {
  return request<WorkspaceAnalytics>({ method: 'GET', url: `/api/workspaces/${id}/analytics` });
}

export function getActivity(id: string) {
  return request<AuditLog[]>({ method: 'GET', url: `/api/workspaces/${id}/activity` });
}
