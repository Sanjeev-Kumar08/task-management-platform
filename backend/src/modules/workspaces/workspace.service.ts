import mongoose from 'mongoose';
import { Workspace } from './workspace.model.js';
import { Project } from '../projects/project.model.js';
import { Board } from '../boards/board.model.js';
import { Channel } from '../channels/channel.model.js';
import { User } from '../users/user.model.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import { enqueueEmail, enqueueNotification } from '../../jobs/queues.js';
import { invalidateAnalyticsCache } from '../workspaces/analytics.cache.js';
import type {
  AddMemberInput,
  CreateWorkspaceInput,
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

export const workspaceService = {
  async listForUser(userId: string) {
    return Workspace.find({ 'members.userId': userId }).sort({ updatedAt: -1 }).lean();
  },

  async getById(userId: string, id: string) {
    const workspace = await Workspace.findById(id).lean();
    if (!workspace) throw new NotFoundError('Workspace not found');
    const member = workspace.members.find((m) => String(m.userId) === userId);
    if (!member) throw new ForbiddenError('Not a workspace member');
    return workspace;
  },

  async create(userId: string, input: CreateWorkspaceInput, ip?: string) {
    const slug = input.slug ?? slugify(input.name);
    const existing = await Workspace.findOne({ slug });
    if (existing) throw new ConflictError('Workspace slug already exists');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [workspace] = await Workspace.create(
        [
          {
            name: input.name,
            slug,
            ownerId: userId,
            members: [{ userId, role: 'OWNER' }],
          },
        ],
        { session },
      );

      const [project] = await Project.create(
        [
          {
            workspaceId: workspace._id,
            name: 'Getting Started',
            description: 'Default project',
            createdBy: userId,
            members: [userId],
          },
        ],
        { session },
      );

      await Board.create(
        [
          {
            projectId: project._id,
            name: 'Main Board',
            columns: [
              { id: 'TODO', name: 'TODO', position: 0 },
              { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
              { id: 'DONE', name: 'DONE', position: 2 },
            ],
          },
        ],
        { session },
      );

      await Channel.create(
        [
          {
            workspaceId: workspace._id,
            name: 'general',
            type: 'PUBLIC',
            createdBy: userId,
          },
        ],
        { session },
      );

      await session.commitTransaction();

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
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async update(userId: string, id: string, input: UpdateWorkspaceInput) {
    await this.assertRole(userId, id, 'ADMIN');
    const workspace = await Workspace.findByIdAndUpdate(id, input, { new: true });
    if (!workspace) throw new NotFoundError('Workspace not found');
    return workspace;
  },

  async remove(userId: string, id: string) {
    await this.assertRole(userId, id, 'OWNER');
    const workspace = await Workspace.findByIdAndDelete(id);
    if (!workspace) throw new NotFoundError('Workspace not found');
    await invalidateAnalyticsCache(id);
    return workspace;
  },

  async addMember(userId: string, id: string, input: AddMemberInput, ip?: string) {
    await this.assertRole(userId, id, 'ADMIN');
    const workspace = await Workspace.findById(id);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const invitee = await User.findOne({ email: input.email.toLowerCase() });
    if (!invitee) throw new NotFoundError('User with that email not found');

    if (workspace.members.some((m) => String(m.userId) === String(invitee._id))) {
      throw new ConflictError('User is already a member');
    }

    workspace.members.push({ userId: invitee._id, role: input.role });
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
      title: 'Workspace invitation',
      message: `You were added to ${workspace.name} as ${input.role}`,
      entityType: 'Workspace',
      entityId: id,
    });

    await enqueueEmail({
      to: invitee.email,
      subject: `You've been invited to ${workspace.name}`,
      body: `You were added as ${input.role} to workspace ${workspace.name}.`,
    });

    return workspace;
  },

  async removeMember(actorId: string, workspaceId: string, memberUserId: string, ip?: string) {
    await this.assertRole(actorId, workspaceId, 'ADMIN');
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const member = workspace.members.find((m) => String(m.userId) === memberUserId);
    if (!member) throw new NotFoundError('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenError('Cannot remove workspace owner');

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
