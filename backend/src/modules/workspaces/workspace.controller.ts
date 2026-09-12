import type { Request, Response, NextFunction } from 'express';
import { workspaceService } from './workspace.service.js';
import { analyticsService } from './analytics.service.js';
import { auditService } from '../audit/audit.service.js';
import { taskService } from '../tasks/task.service.js';
import { sendSuccess } from '../../utils/response.js';

export const workspaceController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.listForUser(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.create(req.user!.id, req.body, req.ip);
      sendSuccess(res, data, 'Workspace created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.getById(req.user!.id, req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.update(req.user!.id, req.params.id, req.body);
      sendSuccess(res, data, 'Workspace updated');
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await workspaceService.remove(req.user!.id, req.params.id, req.ip);
      sendSuccess(res, null, 'Workspace deleted');
    } catch (err) {
      next(err);
    }
  },

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.addMember(req.user!.id, req.params.id, req.body, req.ip);
      sendSuccess(res, data, 'Member added');
    } catch (err) {
      next(err);
    }
  },

  async changeMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.changeMemberRole(
        req.user!.id,
        req.params.id,
        req.params.userId,
        req.body,
        req.ip,
      );
      sendSuccess(res, data, 'Member role updated');
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.removeMember(
        req.user!.id,
        req.params.id,
        req.params.userId,
        req.ip,
      );
      sendSuccess(res, data, 'Member removed');
    } catch (err) {
      next(err);
    }
  },

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.leave(req.user!.id, req.params.id, req.ip);
      sendSuccess(res, data, 'Left workspace');
    } catch (err) {
      next(err);
    }
  },

  async transferOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await workspaceService.transferOwnership(
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
      );
      sendSuccess(res, data, 'Ownership transferred');
    } catch (err) {
      next(err);
    }
  },

  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getWorkspaceAnalytics(req.user!.id, req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async activity(req: Request, res: Response, next: NextFunction) {
    try {
      await workspaceService.assertRole(req.user!.id, req.params.id, 'VIEWER');
      const limit = Number(req.query.limit ?? 50);
      const data = await auditService.listByWorkspace(req.params.id, Math.min(limit, 100));
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async tasks(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await taskService.listByWorkspace(req.user!.id, req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
