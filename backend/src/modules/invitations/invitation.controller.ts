import type { Request, Response, NextFunction } from 'express';
import { invitationService } from './invitation.service.js';
import { sendSuccess } from '../../utils/response.js';

export const invitationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationService.create(req.user!.id, req.params.id, req.body, req.ip);
      sendSuccess(res, data, 'Invitation sent', 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationService.listPending(req.user!.id, req.params.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async resend(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationService.resend(req.user!.id, req.params.id, req.params.inviteId);
      sendSuccess(res, data, 'Invitation resent');
    } catch (err) {
      next(err);
    }
  },

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      await invitationService.revoke(req.user!.id, req.params.id, req.params.inviteId, req.ip);
      sendSuccess(res, null, 'Invitation revoked');
    } catch (err) {
      next(err);
    }
  },

  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationService.preview(req.params.token);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token || req.body.token;
      const data = await invitationService.accept(req.user!.id, token, req.ip);
      sendSuccess(res, data, 'Invitation accepted');
    } catch (err) {
      next(err);
    }
  },

  async openForInvitee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationService.openForInvitee(req.user!.id, req.params.inviteId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
