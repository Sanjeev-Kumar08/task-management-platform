import { Invitation } from './invitation.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { User } from '../users/user.model.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { generateSecureToken, hashToken } from '../../utils/tokens.js';
import { auditService } from '../audit/audit.service.js';
import { enqueueEmail, enqueueNotification } from '../../jobs/queues.js';
import { emailTemplates } from '../../email/email.service.js';
import { env } from '../../config/env.js';
import { getPrimaryClientUrl } from '../../config/cors.js';
import { entitlementsService } from '../entitlements/entitlements.service.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import type { WorkspaceRole } from '../../types/index.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function buildInviteUrl(rawToken: string): string {
  return `${getPrimaryClientUrl()}/invite/${rawToken}`;
}

async function loadPendingByToken(token: string) {
  const tokenHash = hashToken(token);
  const invite = await Invitation.findOne({ tokenHash }).lean();
  if (!invite) throw new NotFoundError('Invitation not found');
  if (invite.status === 'REVOKED') throw new ForbiddenError('Invitation was revoked');
  if (invite.status === 'ACCEPTED') throw new ConflictError('Invitation already accepted');
  if (invite.status === 'EXPIRED' || invite.expiresAt.getTime() < Date.now()) {
    await Invitation.updateOne({ _id: invite._id }, { status: 'EXPIRED' });
    throw new ForbiddenError('Invitation expired');
  }
  if (invite.status !== 'PENDING') throw new ForbiddenError('Invitation is not active');
  return invite;
}

export const invitationService = {
  async create(
    actorId: string,
    workspaceId: string,
    input: { email: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' },
    ip?: string,
  ) {
    await workspaceService.assertRole(actorId, workspaceId, 'ADMIN');
    await entitlementsService.assertCanAddMember(workspaceId);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const email = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser && workspace.members.some((m) => String(m.userId) === String(existingUser._id))) {
      throw new ConflictError('User is already a member');
    }

    const active = await Invitation.findOne({
      workspaceId,
      email,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });
    if (active) throw new ConflictError('An active invitation already exists for this email');

    const rawToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const invite = await Invitation.create({
      workspaceId,
      email,
      role: input.role,
      tokenHash: hashToken(rawToken),
      expiresAt,
      status: 'PENDING',
      invitedBy: actorId,
    });

    const inviter = await User.findById(actorId).lean();
    const inviteUrl = buildInviteUrl(rawToken);
    const invitePath = `/invite/${rawToken}`;
    const tpl = emailTemplates.invitation({
      workspaceName: workspace.name,
      inviterName: inviter?.name ?? 'A teammate',
      role: input.role,
      inviteUrl,
      expiresAt,
    });

    await enqueueEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: 'invitation',
    });

    await auditService.log({
      userId: actorId,
      workspaceId,
      action: 'MEMBER_INVITED',
      entity: 'Invitation',
      entityId: String(invite._id),
      metadata: { email, role: input.role },
      ip,
    });

    if (existingUser) {
      await enqueueNotification({
        userId: String(existingUser._id),
        type: 'WORKSPACE_INVITE',
        title: 'Workspace invitation',
        message: `You were invited to ${workspace.name} as ${input.role}`,
        entityType: 'Invitation',
        entityId: String(invite._id),
        actionUrl: invitePath,
      });
    }

    return {
      id: String(invite._id),
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      inviteUrl: env.NODE_ENV === 'production' ? undefined : inviteUrl,
    };
  },

  async listPending(actorId: string, workspaceId: string) {
    await workspaceService.assertRole(actorId, workspaceId, 'ADMIN');
    const items = await Invitation.find({
      workspaceId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    return items.map((i) => ({
      id: String(i._id),
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt,
      invitedBy: String(i.invitedBy),
      createdAt: i.createdAt,
    }));
  },

  async resend(actorId: string, workspaceId: string, inviteId: string) {
    await workspaceService.assertRole(actorId, workspaceId, 'ADMIN');
    const invite = await Invitation.findOne({ _id: inviteId, workspaceId });
    if (!invite) throw new NotFoundError('Invitation not found');
    if (invite.status !== 'PENDING') throw new ValidationError('Only pending invitations can be resent');

    const rawToken = generateSecureToken(32);
    invite.tokenHash = hashToken(rawToken);
    invite.expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await invite.save();

    const workspace = await Workspace.findById(workspaceId).lean();
    const inviter = await User.findById(actorId).lean();
    const inviteUrl = buildInviteUrl(rawToken);
    const tpl = emailTemplates.invitation({
      workspaceName: workspace?.name ?? 'Workspace',
      inviterName: inviter?.name ?? 'A teammate',
      role: invite.role,
      inviteUrl,
      expiresAt: invite.expiresAt,
    });
    await enqueueEmail({
      to: invite.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: 'invitation',
    });

    return {
      id: String(invite._id),
      expiresAt: invite.expiresAt,
      inviteUrl: env.NODE_ENV === 'production' ? undefined : inviteUrl,
    };
  },

  async revoke(actorId: string, workspaceId: string, inviteId: string, ip?: string) {
    await workspaceService.assertRole(actorId, workspaceId, 'ADMIN');
    const invite = await Invitation.findOne({ _id: inviteId, workspaceId });
    if (!invite) throw new NotFoundError('Invitation not found');
    if (invite.status !== 'PENDING') throw new ValidationError('Only pending invitations can be revoked');
    invite.status = 'REVOKED';
    invite.revokedAt = new Date();
    await invite.save();

    await auditService.log({
      userId: actorId,
      workspaceId,
      action: 'INVITATION_REVOKED',
      entity: 'Invitation',
      entityId: inviteId,
      metadata: { email: invite.email },
      ip,
    });

    return invite;
  },

  async preview(token: string) {
    const invite = await loadPendingByToken(token);
    const workspace = await Workspace.findById(invite.workspaceId).lean();
    return {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      workspace: workspace
        ? { id: String(workspace._id), name: workspace.name, slug: workspace.slug }
        : null,
    };
  },

  /**
   * Invitee opens a notification that only has invitation id (no raw token).
   * Issues a fresh token and returns a path the client can navigate to.
   */
  async openForInvitee(userId: string, inviteId: string): Promise<{ path: string; inviteUrl: string }> {
    const user = await User.findById(userId).lean();
    if (!user) throw new NotFoundError('User not found');

    const invite = await Invitation.findById(inviteId);
    if (!invite) throw new NotFoundError('Invitation not found');
    if (invite.status === 'REVOKED') throw new ForbiddenError('Invitation was revoked');
    if (invite.status === 'ACCEPTED') throw new ConflictError('Invitation already accepted');
    if (invite.status === 'EXPIRED' || invite.expiresAt.getTime() < Date.now()) {
      invite.status = 'EXPIRED';
      await invite.save();
      throw new ForbiddenError('Invitation expired');
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenError('This invitation is for a different email address');
    }

    const rawToken = generateSecureToken(32);
    invite.tokenHash = hashToken(rawToken);
    invite.expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await invite.save();

    const path = `/invite/${rawToken}`;
    return { path, inviteUrl: buildInviteUrl(rawToken) };
  },

  async accept(userId: string, token: string, ip?: string) {
    const invite = await loadPendingByToken(token);
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenError('Invitation email does not match your account');
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    if (workspace.members.some((m) => String(m.userId) === userId)) {
      await Invitation.updateOne(
        { _id: invite._id },
        { status: 'ACCEPTED', acceptedBy: userId, acceptedAt: new Date() },
      );
      return workspace;
    }

    await entitlementsService.assertCanAddMember(String(workspace._id));
    workspace.members.push({ userId: user._id, role: invite.role as WorkspaceRole });
    await workspace.save();

    await Invitation.updateOne(
      { _id: invite._id },
      { status: 'ACCEPTED', acceptedBy: userId, acceptedAt: new Date() },
    );

    await auditService.log({
      userId,
      workspaceId: String(workspace._id),
      action: 'INVITATION_ACCEPTED',
      entity: 'Invitation',
      entityId: String(invite._id),
      metadata: { role: invite.role },
      ip,
    });

    await enqueueNotification({
      userId: String(invite.invitedBy),
      type: 'INVITATION_ACCEPTED',
      title: 'Invitation accepted',
      message: `${user.name} joined ${workspace.name}`,
      entityType: 'Workspace',
      entityId: String(workspace._id),
      actionUrl: `/workspaces/${String(workspace._id)}`,
    });

    return workspace;
  },
};
