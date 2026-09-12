import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, type ApiSuccess } from '@/types/api';
import { STORAGE_KEYS, readJson, removeKey, writeJson } from '@/utils/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let accessToken: string | null = readJson<string | null>(STORAGE_KEYS.accessToken, null);
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;
let toastHandler: ((message: string, type?: 'error' | 'success' | 'info') => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) writeJson(STORAGE_KEYS.accessToken, token);
  else removeKey(STORAGE_KEYS.accessToken);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function setApiToastHandler(
  handler: ((message: string, type?: 'error' | 'success' | 'info') => void) | null,
): void {
  toastHandler = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const res = await axios.post<ApiSuccess<{ accessToken: string }>>(
    `${API_URL}/api/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = res.data.data.accessToken;
  setAccessToken(token);
  return token;
}

function singleFlightRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .catch(() => {
        setAccessToken(null);
        onUnauthorized?.();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function extractError(error: AxiosError): ApiError {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(0, 'TIMEOUT', 'Request timed out. Please try again.');
    }
    return new ApiError(0, 'NETWORK_ERROR', 'Network error. Check your connection.');
  }

  const status = error.response.status;
  const body = error.response.data as
    { error?: { code?: string; message?: string; details?: unknown } } | undefined;
  const code = body?.error?.code ?? `HTTP_${status}`;
  const message = body?.error?.message ?? error.message ?? 'Request failed';
  const details = body?.error?.details;

  switch (status) {
    case 403:
      return new ApiError(403, code, message || 'You do not have permission to do that.', details);
    case 422:
      return new ApiError(422, code, message || 'Validation failed.', details);
    case 429:
      return new ApiError(429, code, message || 'Too many requests. Please slow down.', details);
    case 500:
      return new ApiError(500, code, message || 'Server error. Try again later.', details);
    default:
      return new ApiError(status, code, message, details);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/api/auth/refresh')
    ) {
      original._retry = true;
      const token = await singleFlightRefresh();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      return Promise.reject(extractError(error));
    }

    const apiError = extractError(error);

    if (
      apiError.code === 'NETWORK_ERROR' ||
      apiError.code === 'TIMEOUT' ||
      [403, 422, 429, 500].includes(apiError.status)
    ) {
      toastHandler?.(apiError.message, 'error');
    }

    return Promise.reject(apiError);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<ApiSuccess<T>>(config);
  return res.data.data;
}

export function getApiBaseUrl(): string {
  return API_URL;
}
