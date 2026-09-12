import { Router } from 'express';
import { invitationController } from './invitation.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const invitationPublicRoutes = Router();
export const invitationAuthRoutes = Router();

invitationPublicRoutes.get('/:token', invitationController.preview);

invitationAuthRoutes.use(authenticate);
invitationAuthRoutes.post('/by-id/:inviteId/open', invitationController.openForInvitee);
invitationAuthRoutes.post('/:token/accept', invitationController.accept);
