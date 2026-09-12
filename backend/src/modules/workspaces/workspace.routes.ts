import { Router } from 'express';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addMemberSchema,
  changeMemberRoleSchema,
  createWorkspaceSchema,
  transferOwnershipSchema,
  updateWorkspaceSchema,
} from './workspace.validation.js';
import { workspaceController } from './workspace.controller.js';
import { invitationController } from '../invitations/invitation.controller.js';
import { createInvitationSchema } from '../invitations/invitation.validation.js';

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
workspaceRoutes.patch(
  '/:id/members/:userId',
  requireWorkspaceRole('ADMIN', 'id'),
  validate(changeMemberRoleSchema),
  workspaceController.changeMemberRole,
);
workspaceRoutes.delete(
  '/:id/members/:userId',
  requireWorkspaceRole('ADMIN', 'id'),
  workspaceController.removeMember,
);
workspaceRoutes.post('/:id/leave', workspaceController.leave);
workspaceRoutes.post(
  '/:id/transfer-ownership',
  requireWorkspaceRole('OWNER', 'id'),
  validate(transferOwnershipSchema),
  workspaceController.transferOwnership,
);
workspaceRoutes.get('/:id/analytics', workspaceController.analytics);
workspaceRoutes.get('/:id/activity', workspaceController.activity);
workspaceRoutes.get('/:id/tasks', workspaceController.tasks);

workspaceRoutes.get(
  '/:id/invitations',
  requireWorkspaceRole('ADMIN', 'id'),
  invitationController.list,
);
workspaceRoutes.post(
  '/:id/invitations',
  requireWorkspaceRole('ADMIN', 'id'),
  validate(createInvitationSchema),
  invitationController.create,
);
workspaceRoutes.post(
  '/:id/invitations/:inviteId/resend',
  requireWorkspaceRole('ADMIN', 'id'),
  invitationController.resend,
);
workspaceRoutes.delete(
  '/:id/invitations/:inviteId',
  requireWorkspaceRole('ADMIN', 'id'),
  invitationController.revoke,
);
