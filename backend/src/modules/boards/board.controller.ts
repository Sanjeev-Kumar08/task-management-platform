import type { Request, Response, NextFunction } from 'express';
import { boardService } from './board.service.js';
import { sendSuccess } from '../../utils/response.js';

export const boardController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await boardService.list(req.user!.id, req.params.projectId));
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await boardService.create(req.user!.id, req.params.projectId, req.body, req.ip);
      sendSuccess(res, data, 'Board created successfully', 201);
    } catch (err) {
      next(err);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await boardService.get(req.user!.id, req.params.id));
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(
        res,
        await boardService.update(req.user!.id, req.params.id, req.body),
        'Board updated',
      );
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await boardService.remove(req.user!.id, req.params.id);
      sendSuccess(res, null, 'Board deleted');
    } catch (err) {
      next(err);
    }
  },
};
