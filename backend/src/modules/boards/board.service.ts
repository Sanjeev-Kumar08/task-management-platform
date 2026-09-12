import { Board } from './board.model.js';
import { Project } from '../projects/project.model.js';
import { NotFoundError } from '../../utils/errors.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { auditService } from '../audit/audit.service.js';
import { invalidateAnalyticsCache } from '../workspaces/analytics.cache.js';
import type { CreateBoardInput, UpdateBoardInput } from './board.validation.js';

async function getProjectWorkspace(projectId: string) {
  const project = await Project.findById(projectId).lean();
  if (!project) throw new NotFoundError('Project not found');
  return project;
}

export const boardService = {
  async list(userId: string, projectId: string) {
    const project = await getProjectWorkspace(projectId);
    await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
    return Board.find({ projectId }).sort({ createdAt: 1 }).lean();
  },

  async create(userId: string, projectId: string, input: CreateBoardInput, ip?: string) {
    const project = await getProjectWorkspace(projectId);
    await workspaceService.assertRole(userId, String(project.workspaceId), 'ADMIN');
    const board = await Board.create({
      projectId,
      name: input.name,
      columns: [
        { id: 'TODO', name: 'TODO', position: 0 },
        { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
        { id: 'DONE', name: 'DONE', position: 2 },
      ],
    });
    await auditService.log({
      userId,
      workspaceId: String(project.workspaceId),
      action: 'BOARD_CREATED',
      entity: 'Board',
      entityId: String(board._id),
      metadata: { name: board.name },
      ip,
    });
    await invalidateAnalyticsCache(String(project.workspaceId));
    return board;
  },

  async get(userId: string, id: string) {
    const board = await Board.findById(id).lean();
    if (!board) throw new NotFoundError('Board not found');
    const project = await getProjectWorkspace(String(board.projectId));
    await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
    return board;
  },

  async update(userId: string, id: string, input: UpdateBoardInput) {
    const board = await Board.findById(id);
    if (!board) throw new NotFoundError('Board not found');
    const project = await getProjectWorkspace(String(board.projectId));
    await workspaceService.assertRole(userId, String(project.workspaceId), 'ADMIN');
    Object.assign(board, input);
    await board.save();
    await invalidateAnalyticsCache(String(project.workspaceId));
    return board;
  },

  async remove(userId: string, id: string) {
    const board = await Board.findById(id);
    if (!board) throw new NotFoundError('Board not found');
    const project = await getProjectWorkspace(String(board.projectId));
    await workspaceService.assertRole(userId, String(project.workspaceId), 'ADMIN');
    await board.deleteOne();
    await invalidateAnalyticsCache(String(project.workspaceId));
  },
};
