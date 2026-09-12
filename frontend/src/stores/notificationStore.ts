import { create } from 'zustand';
import type { Notification } from '@/types';
import { normalizeId, normalizeList } from '@/utils/normalize';
import * as notificationService from '@/services/notification.service';

interface NotificationState {
  items: Notification[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  unreadCount: number;
  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  prepend: (notification: Notification) => void;
}

function countUnread(items: Notification[]): number {
  return items.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  page: 0,
  hasMore: true,
  loading: false,
  loadingMore: false,
  unreadCount: 0,

  fetchInitial: async () => {
    set({ loading: true });
    try {
      const data = await notificationService.listNotifications(1, 20);
      const items = normalizeList(data.items as Array<Notification & { _id?: string }>);
      set({
        items,
        page: 1,
        hasMore: data.hasMore,
        loading: false,
        unreadCount: countUnread(items),
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchMore: async () => {
    const { hasMore, loadingMore, page } = get();
    if (!hasMore || loadingMore) return;
    set({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const data = await notificationService.listNotifications(nextPage, 20);
      const more = normalizeList(data.items as Array<Notification & { _id?: string }>);
      set((state) => {
        const items = [...state.items, ...more];
        return {
          items,
          page: nextPage,
          hasMore: data.hasMore,
          loadingMore: false,
          unreadCount: countUnread(items),
        };
      });
    } catch {
      set({ loadingMore: false });
    }
  },

  markRead: async (id) => {
    await notificationService.markRead(id);
    set((state) => {
      const items = state.items.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { items, unreadCount: countUnread(items) };
    });
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  prepend: (notification) => {
    const n = normalizeId(notification as Notification & { _id?: string });
    set((state) => {
      if (state.items.some((i) => i.id === n.id)) return state;
      const items = [n, ...state.items];
      return { items, unreadCount: countUnread(items) };
    });
  },
}));
