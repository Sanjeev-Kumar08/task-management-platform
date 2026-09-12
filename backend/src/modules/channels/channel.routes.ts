import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { Channel } from './channel.model.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { sendSuccess } from '../../utils/response.js';

export const channelRoutes = Router({ mergeParams: true });
channelRoutes.use(authenticate);

channelRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'VIEWER');
    const data = await Channel.find({ workspaceId: req.params.workspaceId })
      .sort({ name: 1 })
      .lean();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});
