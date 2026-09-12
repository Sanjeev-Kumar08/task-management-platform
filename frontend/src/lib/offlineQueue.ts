import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';
import * as commentService from '@/services/comment.service';
import * as messageService from '@/services/message.service';
import * as taskService from '@/services/task.service';

export type OfflineMutation =
  | { id: string; type: 'createComment'; taskId: string; content: string; createdAt: string }
  | {
      id: string;
      type: 'sendMessage';
      channelId: string;
      content: string;
      parentMessageId?: string | null;
      createdAt: string;
    }
  | {
      id: string;
      type: 'createTask';
      boardId: string;
      title: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      createdAt: string;
    };

type NewOfflineMutation =
  | { type: 'createComment'; taskId: string; content: string; id?: string }
  | {
      type: 'sendMessage';
      channelId: string;
      content: string;
      parentMessageId?: string | null;
      id?: string;
    }
  | {
      type: 'createTask';
      boardId: string;
      title: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      id?: string;
    };

function loadQueue(): OfflineMutation[] {
  return readJson<OfflineMutation[]>(STORAGE_KEYS.offlineQueue, []);
}

function saveQueue(queue: OfflineMutation[]): void {
  writeJson(STORAGE_KEYS.offlineQueue, queue);
}

export function enqueueOfflineMutation(mutation: NewOfflineMutation): OfflineMutation {
  const item = {
    ...mutation,
    id: mutation.id ?? `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  } as OfflineMutation;
  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
  return item;
}

export function getOfflineQueue(): OfflineMutation[] {
  return loadQueue();
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = loadQueue();
  if (!queue.length) return 0;
  const remaining: OfflineMutation[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === 'createComment') {
        await commentService.createComment(item.taskId, item.content);
      } else if (item.type === 'sendMessage') {
        await messageService.sendMessage(item.channelId, item.content, item.parentMessageId);
      } else if (item.type === 'createTask') {
        await taskService.createTask(item.boardId, {
          title: item.title,
          status: item.status,
        });
      }
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  return synced;
}
