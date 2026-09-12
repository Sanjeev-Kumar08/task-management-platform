import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', 'Route not found');
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 422, 'VALIDATION_ERROR', 'Invalid request data', err.flatten());
    return;
  }

  if (err instanceof multer.MulterError) {
    sendError(res, 400, 'UPLOAD_ERROR', err.message);
    return;
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const mongoErr = err as { code?: number; message?: string };
    if (mongoErr.code === 11000) {
      sendError(res, 409, 'DUPLICATE_KEY', 'Resource already exists');
      return;
    }
  }

  logger.error({ err }, 'Unhandled error');
  const message = env.isProd
    ? 'Internal server error'
    : err instanceof Error
      ? err.message
      : 'Error';
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
