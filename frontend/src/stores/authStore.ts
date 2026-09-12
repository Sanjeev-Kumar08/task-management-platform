import { create } from 'zustand';
import type { User } from '@/types';
import { getAccessToken, setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import { connectSocket, disconnectSocket, updateSocketAuth } from '@/lib/socket';
import * as authService from '@/services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  bootstrapped: boolean;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  setUnauthorizedHandler(() => {
    get().clearSession();
  });

  return {
    user: null,
    accessToken: getAccessToken(),
    bootstrapped: false,
    loading: false,
    error: null,

    setSession: (user, accessToken) => {
      setAccessToken(accessToken);
      set({ user, accessToken, error: null });
      connectSocket();
      updateSocketAuth(accessToken);
    },

    clearSession: () => {
      setAccessToken(null);
      disconnectSocket();
      set({ user: null, accessToken: null, error: null });
    },

    bootstrap: async () => {
      if (get().bootstrapped) return;
      const token = getAccessToken();
      if (!token) {
        set({ bootstrapped: true, user: null });
        return;
      }
      try {
        const user = await authService.me();
        set({ user, accessToken: token, bootstrapped: true });
        connectSocket();
        updateSocketAuth(token);
      } catch {
        get().clearSession();
        set({ bootstrapped: true });
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await authService.login({ email, password });
        get().setSession(data.user, data.accessToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        set({ error: message });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    register: async (name, email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await authService.register({ name, email, password });
        get().setSession(data.user, data.accessToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        set({ error: message });
        throw err;
      } finally {
        set({ loading: false });
      }
    },

    logout: async () => {
      try {
        await authService.logout();
      } catch {
        // still clear local session
      } finally {
        get().clearSession();
      }
    },
  };
});
