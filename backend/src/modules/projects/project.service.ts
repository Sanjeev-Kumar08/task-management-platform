import { Project } from './project.model.js';
import { Board } from '../boards/board.model.js';
import { Task } from '../tasks/task.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { auditService } from '../audit/audit.service.js';
import { invalidateAnalyticsCache } from '../workspaces/analytics.cache.js';
import { entitlementsService } from '../entitlements/entitlements.service.js';
import { ROLE_RANK } from '../../types/index.js';
import type { CreateProjectInput, UpdateProjectInput } from './project.validation.js';

export const projectService = {
  async list(userId: string, workspaceId: string, opts?: { q?: string; archived?: boolean }) {
    await workspaceService.assertRole(userId, workspaceId, 'VIEWER');
    const filter: Record<string, unknown> = { workspaceId };
    if (opts?.archived === true) filter.archived = true;
    else if (opts?.archived === false) filter.archived = { $ne: true };
    if (opts?.q) filter.$text = { $search: opts.q };
    return Project.find(filter).sort({ updatedAt: -1 }).lean();
  },

  async create(userId: string, workspaceId: string, input: CreateProjectInput, ip?: string) {
    await workspaceService.assertRole(userId, workspaceId, 'ADMIN');
    await entitlementsService.assertCanCreateProject(workspaceId);
    const project = await Project.create({
      workspaceId,
      name: input.name,
      description: input.description ?? '',
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

    await auditService.log({
      userId,
      workspaceId,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: String(project._id),
      metadata: { name: project.name },
      ip,
    });

    await invalidateAnalyticsCache(workspaceId);
    return project;
  },

  async get(userId: string, id: string) {
    const project = await Project.findById(id).lean();
    if (!project) throw new NotFoundError('Project not found');
    await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
    return project;
  },

  async update(userId: string, id: string, input: UpdateProjectInput, ip?: string) {
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project not found');
    await workspaceService.assertRole(userId, String(project.workspaceId), 'ADMIN');
    Object.assign(project, input);
    await project.save();

    await auditService.log({
      userId,
      workspaceId: String(project.workspaceId),
      action: input.archived ? 'PROJECT_ARCHIVED' : 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: id,
      metadata: input,
      ip,
    });
    await invalidateAnalyticsCache(String(project.workspaceId));
    return project;
  },

  async remove(userId: string, id: string, ip?: string) {
    const project = await Project.findById(id);
    if (!project) throw new NotFoundError('Project not found');
    const workspaceId = String(project.workspaceId);
    const role = await workspaceService.assertRole(userId, workspaceId, 'VIEWER');
    const isCreator = String(project.createdBy) === userId;
    const isAdmin = ROLE_RANK[role] >= ROLE_RANK.ADMIN;
    if (!isCreator && !isAdmin) {
      throw new ForbiddenError('Only the project creator or a workspace admin can delete this project');
    }

    await Task.deleteMany({ projectId: project._id });
    await Board.deleteMany({ projectId: project._id });
    await project.deleteOne();

    await auditService.log({
      userId,
      workspaceId,
      action: 'PROJECT_DELETED',
      entity: 'Project',
      entityId: id,
      ip,
    });
    await invalidateAnalyticsCache(workspaceId);
  },
};
