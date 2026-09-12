import { request } from '@/lib/api';
import type { Board } from '@/types';

export function listBoards(projectId: string) {
  return request<Board[]>({ method: 'GET', url: `/api/projects/${projectId}/boards` });
}

export function getBoard(id: string) {
  return request<Board>({ method: 'GET', url: `/api/boards/${id}` });
}

export function createBoard(projectId: string, input: { name: string }) {
  return request<Board>({ method: 'POST', url: `/api/projects/${projectId}/boards`, data: input });
}
