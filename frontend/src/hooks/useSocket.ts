import { useEffect } from 'react';
import { connectSocket, getSocket, joinRoom } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { useBoardStore } from '@/stores/boardStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { MessageCreatedEvent, NotificationNewEvent, Task, TaskMovedEvent } from '@/types';
import { normalizeId } from '@/utils/normalize';

export function useSocketLifecycle(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const applyRemoteMove = useBoardStore((s) => s.applyRemoteMove);
  const upsertTask = useBoardStore((s) => s.upsertTask);
  const removeTask = useBoardStore((s) => s.removeTask);
  const prependNotification = useNotificationStore((s) => s.prepend);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket();

    const onMoved = (payload: TaskMovedEvent) => {
      const task = normalizeId(payload.task as Task & { _id?: string });
      applyRemoteMove(task, payload.mutationId ?? payload.eventId);
    };
    const onCreated = (payload: { task: Task }) => {
      upsertTask(normalizeId(payload.task as Task & { _id?: string }));
    };
    const onUpdated = (payload: { task: Task }) => {
      upsertTask(normalizeId(payload.task as Task & { _id?: string }));
    };
    const onDeleted = (payload: { taskId: string }) => {
      removeTask(payload.taskId);
    };
    const onNotification = (
      payload: NotificationNewEvent | ({ notification?: never } & Record<string, unknown>),
    ) => {
      const n =
        'notification' in payload && payload.notification
          ? payload.notification
          : (payload as unknown as NotificationNewEvent['notification']);
      if (n) prependNotification(n);
    };

    socket.on('task:moved', onMoved);
    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('task:deleted', onDeleted);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('task:moved', onMoved);
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('task:deleted', onDeleted);
      socket.off('notification:new', onNotification);
    };
  }, [accessToken, applyRemoteMove, upsertTask, removeTask, prependNotification]);
}

export function useBoardSocket(boardId: string | undefined): void {
  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket() ?? connectSocket();
    joinRoom('join:board', boardId);
    return () => {
      // rooms persist for session; no leave API required
      void socket;
    };
  }, [boardId]);
}

export function useWorkspaceSocket(workspaceId: string | undefined): void {
  useEffect(() => {
    if (!workspaceId) return;
    joinRoom('join:workspace', workspaceId);
  }, [workspaceId]);
}

export function useChannelSocket(
  channelId: string | undefined,
  onMessage: (event: MessageCreatedEvent) => void,
): void {
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket() ?? connectSocket();
    joinRoom('join:channel', channelId);
    const handler = (payload: MessageCreatedEvent) => onMessage(payload);
    socket.on('message:created', handler);
    return () => {
      socket.off('message:created', handler);
    };
  }, [channelId, onMessage]);
}
