import { create } from 'zustand';
import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';

export type Theme = 'light' | 'dark';

export interface ToastItem {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export interface ConfirmOptions {
  id: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  resolve: (confirmed: boolean) => void;
}

export type ConfirmRequest = Omit<ConfirmOptions, 'id' | 'resolve'>;

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  toasts: ToastItem[];
  searchOpen: boolean;
  confirm: ConfirmOptions | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  pushToast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
  setSearchOpen: (open: boolean) => void;
  requestConfirm: (options: ConfirmRequest) => Promise<boolean>;
  resolveConfirm: (confirmed: boolean) => void;
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  writeJson(STORAGE_KEYS.theme, theme);
}

const initialTheme = ((): Theme => {
  const stored = readJson<Theme | null>(STORAGE_KEYS.theme, null);
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
})();

if (typeof document !== 'undefined') {
  applyTheme(initialTheme);
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: initialTheme,
  sidebarCollapsed: false,
  toasts: [],
  searchOpen: false,
  confirm: null,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  pushToast: (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    window.setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setSearchOpen: (open) => set({ searchOpen: open }),

  requestConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      const existing = get().confirm;
      if (existing) existing.resolve(false);
      set({
        confirm: {
          id: `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...options,
          resolve,
        },
      });
    }),

  resolveConfirm: (confirmed) => {
    const current = get().confirm;
    if (!current) return;
    set({ confirm: null });
    current.resolve(confirmed);
  },
}));

/** Promise-based themed confirm — replaces window.confirm */
export function confirmDialog(options: ConfirmRequest): Promise<boolean> {
  return useUiStore.getState().requestConfirm(options);
}
