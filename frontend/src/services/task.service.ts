import { request } from '@/lib/api';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export function listTasks(boardId: string) {
  return request<Task[]>({ method: 'GET', url: `/api/boards/${boardId}/tasks` });
}

export function getTask(id: string) {
  return request<Task>({ method: 'GET', url: `/api/tasks/${id}` });
}

export function createTask(
  boardId: string,
  input: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: string | null;
    labels?: string[];
  },
) {
  return request<Task>({ method: 'POST', url: `/api/boards/${boardId}/tasks`, data: input });
}

export function updateTask(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string | null;
    dueDate: string | null;
    position: number;
    labels: string[];
  }>,
) {
  return request<Task>({ method: 'PATCH', url: `/api/tasks/${id}`, data: input });
}

export function moveTask(
  id: string,
  input: { status: TaskStatus; position: number; mutationId?: string },
) {
  return request<Task>({ method: 'PATCH', url: `/api/tasks/${id}/move`, data: input });
}

export function assignTask(id: string, assigneeId: string | null) {
  return request<Task>({ method: 'PATCH', url: `/api/tasks/${id}/assign`, data: { assigneeId } });
}

export function deleteTask(id: string) {
  return request<null>({ method: 'DELETE', url: `/api/tasks/${id}` });
}

export async function uploadAttachment(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<Task>({
    method: 'POST',
    url: `/api/tasks/${id}/attachments`,
    data: form,
  });
}
