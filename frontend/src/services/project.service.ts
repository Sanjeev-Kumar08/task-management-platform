import { request } from '@/lib/api';
import type { Project } from '@/types';

export function listProjects(
  workspaceId: string,
  opts?: { q?: string; archived?: boolean },
) {
  return request<Project[]>({
    method: 'GET',
    url: `/api/workspaces/${workspaceId}/projects`,
    params: {
      q: opts?.q,
      archived: opts?.archived === undefined ? undefined : String(opts.archived),
    },
  });
}

export function getProject(id: string) {
  return request<Project>({ method: 'GET', url: `/api/projects/${id}` });
}

export function createProject(workspaceId: string, input: { name: string; description?: string }) {
  return request<Project>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/projects`,
    data: input,
  });
}

export function updateProject(
  id: string,
  input: { name?: string; description?: string; archived?: boolean },
) {
  return request<Project>({ method: 'PATCH', url: `/api/projects/${id}`, data: input });
}

export function deleteProject(id: string) {
  return request<null>({ method: 'DELETE', url: `/api/projects/${id}` });
}
