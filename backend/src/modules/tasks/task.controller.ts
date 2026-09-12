import type { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ValidationError } from '../../utils/errors.js';

export const taskController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await taskService.list(req.user!.id, req.params.boardId));
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await taskService.create(req.user!.id, req.params.boardId, req.body, req.ip);
      sendSuccess(res, data, 'Task created successfully', 201);
    } catch (err) {
      next(err);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await taskService.get(req.user!.id, req.params.id));
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(
        res,
        await taskService.update(req.user!.id, req.params.id, req.body, req.ip),
        'Task updated',
      );
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.remove(req.user!.id, req.params.id, req.ip);
      sendSuccess(res, null, 'Task deleted');
    } catch (err) {
      next(err);
    }
  },
  async move(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(
        res,
        await taskService.move(req.user!.id, req.params.id, req.body, req.ip),
        'Task moved',
      );
    } catch (err) {
      next(err);
    }
  },
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(
        res,
        await taskService.assign(req.user!.id, req.params.id, req.body),
        'Task assigned',
      );
    } catch (err) {
      next(err);
    }
  },
  async uploadAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError('File is required');
      const data = await taskService.addAttachment(req.user!.id, req.params.id, req.file);
      sendSuccess(res, data, 'Attachment uploaded', 201);
    } catch (err) {
      next(err);
    }
  },
};
