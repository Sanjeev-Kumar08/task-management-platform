import { env } from '../config/env.js';

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export function getConfiguredClientOrigins(): string[] {
  return env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Primary client origin used in emails / Stripe redirects. */
export function getPrimaryClientUrl(): string {
  return getConfiguredClientOrigins()[0] ?? env.CLIENT_URL;
}

export function isAllowedClientOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (getConfiguredClientOrigins().includes(origin)) return true;
  if (!env.isProd && LOCALHOST_ORIGIN.test(origin)) return true;
  return false;
}

export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void,
): void {
  if (isAllowedClientOrigin(origin)) {
    callback(null, origin ?? true);
    return;
  }
  callback(new Error(`CORS blocked origin: ${origin}`));
}
