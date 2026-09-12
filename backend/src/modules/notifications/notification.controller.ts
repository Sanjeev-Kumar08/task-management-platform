import type { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';
import { sendSuccess } from '../../utils/response.js';

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      sendSuccess(res, await notificationService.list(req.user!.id, page, limit));
    } catch (err) {
      next(err);
    }
  },
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(
        res,
        await notificationService.markRead(req.user!.id, req.params.id),
        'Marked read',
      );
    } catch (err) {
      next(err);
    }
  },
  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await notificationService.markAllRead(req.user!.id), 'All marked read');
    } catch (err) {
      next(err);
    }
  },
};
