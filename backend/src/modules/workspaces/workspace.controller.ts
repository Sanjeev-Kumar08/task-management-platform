import type { Request, Response, NextFunction } from 'express';
import { workspaceService } from './workspace.service.js';
import { analyticsService } from './analytics.service.js';
import { auditService } from '../audit/audit.service.js';
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
      await workspaceService.remove(req.user!.id, req.params.id);
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
      const data = await auditService.listByWorkspace(req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
