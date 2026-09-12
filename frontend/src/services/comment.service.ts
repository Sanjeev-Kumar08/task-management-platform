import { request } from '@/lib/api';
import type { Comment } from '@/types';

export function listComments(taskId: string) {
  return request<Comment[]>({ method: 'GET', url: `/api/tasks/${taskId}/comments` });
}

export function createComment(taskId: string, content: string) {
  return request<Comment>({
    method: 'POST',
    url: `/api/tasks/${taskId}/comments`,
    data: { content },
  });
}

export function updateComment(id: string, content: string) {
  return request<Comment>({ method: 'PATCH', url: `/api/comments/${id}`, data: { content } });
}

export function deleteComment(id: string) {
  return request<null>({ method: 'DELETE', url: `/api/comments/${id}` });
}
