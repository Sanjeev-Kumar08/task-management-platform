import { Router } from 'express';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from './workspace.validation.js';
import { workspaceController } from './workspace.controller.js';

export const workspaceRoutes = Router();

workspaceRoutes.use(authenticate);

workspaceRoutes.get('/', workspaceController.list);
workspaceRoutes.post('/', validate(createWorkspaceSchema), workspaceController.create);
workspaceRoutes.get('/:id', workspaceController.get);
workspaceRoutes.patch(
  '/:id',
  requireWorkspaceRole('ADMIN', 'id'),
  validate(updateWorkspaceSchema),
  workspaceController.update,
);
workspaceRoutes.delete('/:id', requireWorkspaceRole('OWNER', 'id'), workspaceController.remove);
workspaceRoutes.post(
  '/:id/members',
  requireWorkspaceRole('ADMIN', 'id'),
  validate(addMemberSchema),
  workspaceController.addMember,
);
workspaceRoutes.delete(
  '/:id/members/:userId',
  requireWorkspaceRole('ADMIN', 'id'),
  workspaceController.removeMember,
);
workspaceRoutes.get('/:id/analytics', workspaceController.analytics);
workspaceRoutes.get('/:id/activity', workspaceController.activity);
