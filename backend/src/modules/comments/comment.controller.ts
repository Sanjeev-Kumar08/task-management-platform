import type { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service.js';
import { sendSuccess } from '../../utils/response.js';

export const commentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await commentService.list(req.user!.id, req.params.taskId));
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await commentService.create(req.user!.id, req.params.taskId, req.body, req.ip);
      sendSuccess(res, data, 'Comment created', 201);
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await commentService.remove(req.user!.id, req.params.id);
      sendSuccess(res, null, 'Comment deleted');
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await commentService.update(req.user!.id, req.params.id, req.body.content);
      sendSuccess(res, data, 'Comment updated');
    } catch (err) {
      next(err);
    }
  },
};
