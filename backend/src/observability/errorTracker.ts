import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface ErrorTracker {
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string, context?: Record<string, unknown>): void;
}

class ConsoleErrorTracker implements ErrorTracker {
  captureException(error: unknown, context?: Record<string, unknown>): void {
    logger.error({ err: error, ...context }, 'Captured exception');
  }

  captureMessage(message: string, context?: Record<string, unknown>): void {
    logger.warn({ ...context }, message);
  }
}

class SentryErrorTracker implements ErrorTracker {
  captureException(error: unknown, context?: Record<string, unknown>): void {
    // Adapter ready for @sentry/node; logs until DSN runtime SDK is wired by ops.
    logger.error(
      { err: error, sentryDsnConfigured: Boolean(env.SENTRY_DSN), ...context },
      'Sentry captureException',
    );
  }

  captureMessage(message: string, context?: Record<string, unknown>): void {
    logger.warn({ sentryDsnConfigured: Boolean(env.SENTRY_DSN), ...context }, message);
  }
}

export const errorTracker: ErrorTracker =
  env.ERROR_TRACKER === 'sentry' ? new SentryErrorTracker() : new ConsoleErrorTracker();
