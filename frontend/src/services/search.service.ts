import { request } from '@/lib/api';
import type { SearchResults } from '@/types';

export function search(q: string, workspaceId?: string) {
  return request<SearchResults>({
    method: 'GET',
    url: '/api/search',
    params: { q, workspaceId },
  });
}
