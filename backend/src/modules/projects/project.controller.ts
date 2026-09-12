import type { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service.js';
import { sendSuccess } from '../../utils/response.js';

export const projectController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectService.list(req.user!.id, req.params.workspaceId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectService.create(
        req.user!.id,
        req.params.workspaceId,
        req.body,
        req.ip,
      );
      sendSuccess(res, data, 'Project created successfully', 201);
    } catch (err) {
      next(err);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectService.get(req.user!.id, req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectService.update(req.user!.id, req.params.id, req.body, req.ip);
      sendSuccess(res, data, 'Project updated');
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.remove(req.user!.id, req.params.id, req.ip);
      sendSuccess(res, null, 'Project deleted');
    } catch (err) {
      next(err);
    }
  },
};
