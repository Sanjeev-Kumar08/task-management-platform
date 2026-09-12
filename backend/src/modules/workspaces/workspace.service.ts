import mongoose from 'mongoose';
import { Workspace } from './workspace.model.js';
import { Project } from '../projects/project.model.js';
import { Board } from '../boards/board.model.js';
import { Channel } from '../channels/channel.model.js';
import { User } from '../users/user.model.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import { enqueueEmail, enqueueNotification } from '../../jobs/queues.js';
import { invalidateAnalyticsCache } from '../workspaces/analytics.cache.js';
import { entitlementsService } from '../entitlements/entitlements.service.js';
import { getIO } from '../../sockets/io.js';
import type {
  AddMemberInput,
  ChangeMemberRoleInput,
  CreateWorkspaceInput,
  TransferOwnershipInput,
  UpdateWorkspaceInput,
} from './workspace.validation.js';
import type { WorkspaceRole } from '../../types/index.js';
import { ROLE_RANK } from '../../types/index.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function emitWorkspace(workspaceId: string, event: string, payload: unknown) {
  try {
    getIO()?.to(`workspace:${workspaceId}`).emit(event, payload);
  } catch {
    /* io may be unset in tests */
  }
}

export const workspaceService = {
  async listForUser(userId: string) {
    return Workspace.find({ 'members.userId': userId }).sort({ updatedAt: -1 }).lean();
  },

  async getById(userId: string, id: string) {
    const workspace = await Workspace.findById(id)
      .populate('members.userId', 'name email avatar')
      .lean();
    if (!workspace) throw new NotFoundError('Workspace not found');
    const member = workspace.members.find((m) => {
      const uid = typeof m.userId === 'object' && m.userId && '_id' in m.userId
        ? String((m.userId as { _id: unknown })._id)
        : String(m.userId);
      return uid === userId;
    });
    if (!member) throw new ForbiddenError('Not a workspace member');
    return workspace;
  },

  async create(userId: string, input: CreateWorkspaceInput, ip?: string) {
    await entitlementsService.assertCanCreateWorkspace(userId);
    const slug = input.slug ?? slugify(input.name);
    const existing = await Workspace.findOne({ slug });
    if (existing) throw new ConflictError('Workspace slug already exists');

    // Avoid multi-doc transactions: Docker Desktop + host connections often use
    // directConnection, which does not support transaction numbers.
    let workspaceId: string | null = null;
    try {
      const workspace = await Workspace.create({
        name: input.name,
        slug,
        description: input.description ?? '',
        avatar: input.avatar ?? null,
        ownerId: userId,
        members: [{ userId, role: 'OWNER', joinedAt: new Date() }],
      });
      workspaceId = String(workspace._id);

      const project = await Project.create({
        workspaceId: workspace._id,
        name: 'Getting Started',
        description: 'Default project',
        createdBy: userId,
        members: [userId],
      });

      await Board.create({
        projectId: project._id,
        name: 'Main Board',
        columns: [
          { id: 'TODO', name: 'TODO', position: 0 },
          { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
          { id: 'DONE', name: 'DONE', position: 2 },
        ],
      });

      await Channel.create({
        workspaceId: workspace._id,
        name: 'general',
        type: 'PUBLIC',
        createdBy: userId,
        memberIds: [userId],
      });

      await auditService.log({
        userId,
        workspaceId: String(workspace._id),
        action: 'WORKSPACE_CREATED',
        entity: 'Workspace',
        entityId: String(workspace._id),
        metadata: { name: workspace.name },
        ip,
      });

      return workspace;
    } catch (err) {
      if (workspaceId) {
        const projects = await Project.find({ workspaceId }).select('_id').lean();
        const projectIds = projects.map((p) => p._id);
        await Board.deleteMany({ projectId: { $in: projectIds } });
        await Project.deleteMany({ workspaceId });
        await Channel.deleteMany({ workspaceId });
        await Workspace.findByIdAndDelete(workspaceId);
      }
      throw err;
    }
  },

  async update(userId: string, id: string, input: UpdateWorkspaceInput) {
    await this.assertRole(userId, id, 'ADMIN');
    const workspace = await Workspace.findByIdAndUpdate(id, input, { new: true });
    if (!workspace) throw new NotFoundError('Workspace not found');
    await auditService.log({
      userId,
      workspaceId: id,
      action: 'WORKSPACE_UPDATED',
      entity: 'Workspace',
      entityId: id,
      metadata: input,
    });
    emitWorkspace(id, 'workspace:updated', { workspaceId: id });
    return workspace;
  },

  async remove(userId: string, id: string, ip?: string) {
    await this.assertRole(userId, id, 'OWNER');
    const workspace = await Workspace.findByIdAndDelete(id);
    if (!workspace) throw new NotFoundError('Workspace not found');
    await invalidateAnalyticsCache(id);
    await auditService.log({
      userId,
      workspaceId: id,
      action: 'WORKSPACE_DELETED',
      entity: 'Workspace',
      entityId: id,
      ip,
    });
    emitWorkspace(id, 'workspace:deleted', { workspaceId: id });
    return workspace;
  },

  async addMember(userId: string, id: string, input: AddMemberInput, ip?: string) {
    await this.assertRole(userId, id, 'ADMIN');
    await entitlementsService.assertCanAddMember(id);
    const workspace = await Workspace.findById(id);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const invitee = await User.findOne({ email: input.email.toLowerCase() });
    if (!invitee) throw new NotFoundError('User with that email not found');

    if (workspace.members.some((m) => String(m.userId) === String(invitee._id))) {
      throw new ConflictError('User is already a member');
    }

    workspace.members.push({ userId: invitee._id, role: input.role, joinedAt: new Date() });
    await workspace.save();

    await auditService.log({
      userId,
      workspaceId: id,
      action: 'MEMBER_ADDED',
      entity: 'Workspace',
      entityId: id,
      metadata: { memberId: String(invitee._id), role: input.role },
      ip,
    });

    await enqueueNotification({
      userId: String(invitee._id),
      type: 'WORKSPACE_INVITE',
      title: 'Added to workspace',
      message: `You were added to ${workspace.name} as ${input.role}`,
      entityType: 'Workspace',
      entityId: id,
      actionUrl: `/workspaces/${id}`,
    });

    await enqueueEmail({
      to: invitee.email,
      subject: `You've been added to ${workspace.name}`,
      html: `<p>You were added as ${input.role} to workspace <strong>${workspace.name}</strong>.</p>`,
      text: `You were added as ${input.role} to workspace ${workspace.name}.`,
    });

    emitWorkspace(id, 'workspace:member_added', {
      workspaceId: id,
      userId: String(invitee._id),
      role: input.role,
    });

    return workspace;
  },

  async changeMemberRole(
    actorId: string,
    workspaceId: string,
    memberUserId: string,
    input: ChangeMemberRoleInput,
    ip?: string,
  ) {
    await this.assertRole(actorId, workspaceId, 'ADMIN');
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const member = workspace.members.find((m) => String(m.userId) === memberUserId);
    if (!member) throw new NotFoundError('Member not found');
    if (member.role === 'OWNER') {
      throw new ForbiddenError('Use ownership transfer to change the owner role');
    }
    if (actorId === memberUserId) {
      throw new ForbiddenError('Cannot change your own role');
    }

    const previous = member.role;
    member.role = input.role;
    await workspace.save();

    await auditService.log({
      userId: actorId,
      workspaceId,
      action: 'MEMBER_ROLE_CHANGED',
      entity: 'Workspace',
      entityId: workspaceId,
      metadata: { memberId: memberUserId, from: previous, to: input.role },
      ip,
    });

    await enqueueNotification({
      userId: memberUserId,
      type: 'ROLE_CHANGED',
      title: 'Role updated',
      message: `Your role in ${workspace.name} is now ${input.role}`,
      entityType: 'Workspace',
      entityId: workspaceId,
      actionUrl: `/workspaces/${workspaceId}`,
    });

    emitWorkspace(workspaceId, 'workspace:member_updated', {
      workspaceId,
      userId: memberUserId,
      role: input.role,
    });

    return workspace;
  },

  async removeMember(actorId: string, workspaceId: string, memberUserId: string, ip?: string) {
    await this.assertRole(actorId, workspaceId, 'ADMIN');
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const member = workspace.members.find((m) => String(m.userId) === memberUserId);
    if (!member) throw new NotFoundError('Member not found');
    if (member.role === 'OWNER') {
      const owners = workspace.members.filter((m) => m.role === 'OWNER');
      if (owners.length <= 1) {
        throw new ForbiddenError('Cannot remove the last owner');
      }
    }

    workspace.set(
      'members',
      workspace.members.filter((m) => String(m.userId) !== memberUserId),
    );
    await workspace.save();

    await auditService.log({
      userId: actorId,
      workspaceId,
      action: 'MEMBER_REMOVED',
      entity: 'Workspace',
      entityId: workspaceId,
      metadata: { memberId: memberUserId },
      ip,
    });

    emitWorkspace(workspaceId, 'workspace:member_removed', {
      workspaceId,
      userId: memberUserId,
    });

    return workspace;
  },

  async leave(userId: string, workspaceId: string, ip?: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');
    const member = workspace.members.find((m) => String(m.userId) === userId);
    if (!member) throw new ForbiddenError('Not a workspace member');

    if (member.role === 'OWNER') {
      const owners = workspace.members.filter((m) => m.role === 'OWNER');
      if (owners.length <= 1) {
        throw new ForbiddenError(
          'Sole owners must transfer ownership or delete the workspace before leaving',
        );
      }
    }

    workspace.set(
      'members',
      workspace.members.filter((m) => String(m.userId) !== userId),
    );
    await workspace.save();

    await auditService.log({
      userId,
      workspaceId,
      action: 'MEMBER_LEFT',
      entity: 'Workspace',
      entityId: workspaceId,
      ip,
    });

    emitWorkspace(workspaceId, 'workspace:member_removed', { workspaceId, userId });
    return { left: true };
  },

  async transferOwnership(
    actorId: string,
    workspaceId: string,
    input: TransferOwnershipInput,
    ip?: string,
  ) {
    await this.assertRole(actorId, workspaceId, 'OWNER');
    if (actorId === input.newOwnerId) {
      throw new ValidationError('Already the owner');
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const target = workspace.members.find((m) => String(m.userId) === input.newOwnerId);
    if (!target) throw new NotFoundError('Target must be a workspace member');

    const currentOwner = workspace.members.find((m) => String(m.userId) === actorId);
    if (!currentOwner || currentOwner.role !== 'OWNER') {
      throw new ForbiddenError('Only the current owner can transfer ownership');
    }

    currentOwner.role = 'ADMIN';
    target.role = 'OWNER';
    workspace.ownerId = target.userId as mongoose.Types.ObjectId;
    await workspace.save();

    await auditService.log({
      userId: actorId,
      workspaceId,
      action: 'OWNERSHIP_TRANSFERRED',
      entity: 'Workspace',
      entityId: workspaceId,
      metadata: { from: actorId, to: input.newOwnerId },
      ip,
    });

    await enqueueNotification({
      userId: input.newOwnerId,
      type: 'OWNERSHIP_TRANSFERRED',
      title: 'You are now the owner',
      message: `Ownership of ${workspace.name} was transferred to you`,
      entityType: 'Workspace',
      entityId: workspaceId,
      actionUrl: `/workspaces/${workspaceId}`,
    });

    emitWorkspace(workspaceId, 'workspace:ownership_transferred', {
      workspaceId,
      newOwnerId: input.newOwnerId,
    });

    return workspace;
  },

  async assertRole(
    userId: string,
    workspaceId: string,
    minRole: WorkspaceRole,
  ): Promise<WorkspaceRole> {
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) throw new NotFoundError('Workspace not found');
    const member = workspace.members.find((m) => String(m.userId) === userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    const role = member.role as WorkspaceRole;
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw new ForbiddenError(`Requires ${minRole} or higher`);
    }
    return role;
  },
};
