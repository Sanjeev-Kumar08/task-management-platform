import { randomUUID } from 'node:crypto';
import { Task } from './task.model.js';
import { Board } from '../boards/board.model.js';
import { Project } from '../projects/project.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { auditService } from '../audit/audit.service.js';
import { invalidateAnalyticsCache } from '../workspaces/analytics.cache.js';
import { enqueueNotification } from '../../jobs/queues.js';
import { getIO } from '../../sockets/io.js';
import type {
  AssignTaskInput,
  CreateTaskInput,
  MoveTaskInput,
  UpdateTaskInput,
} from './task.validation.js';
import type { WorkspaceRole } from '../../types/index.js';
import { ROLE_RANK } from '../../types/index.js';

async function resolveTaskContext(boardId: string) {
  const board = await Board.findById(boardId).lean();
  if (!board) throw new NotFoundError('Board not found');
  const project = await Project.findById(board.projectId).lean();
  if (!project) throw new NotFoundError('Project not found');
  return { board, project, workspaceId: String(project.workspaceId) };
}

async function assertTaskAccess(userId: string, taskId: string, minRole: WorkspaceRole = 'VIEWER') {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');
  const project = await Project.findById(task.projectId).lean();
  if (!project) throw new NotFoundError('Project not found');
  const role = await workspaceService.assertRole(userId, String(project.workspaceId), minRole);
  return { task, project, workspaceId: String(project.workspaceId), role };
}

function emitBoard(event: string, boardId: string, payload: unknown) {
  getIO()?.to(`board:${boardId}`).emit(event, payload);
}

export const taskService = {
  async list(userId: string, boardId: string) {
    const { workspaceId } = await resolveTaskContext(boardId);
    await workspaceService.assertRole(userId, workspaceId, 'VIEWER');
    return Task.find({ boardId }).sort({ position: 1 }).lean();
  },

  async create(userId: string, boardId: string, input: CreateTaskInput, ip?: string) {
    const { board, workspaceId } = await resolveTaskContext(boardId);
    const role = await workspaceService.assertRole(userId, workspaceId, 'MEMBER');
    if (ROLE_RANK[role] < ROLE_RANK.MEMBER) throw new ForbiddenError();

    const count = await Task.countDocuments({ boardId, status: input.status ?? 'TODO' });
    const task = await Task.create({
      boardId,
      projectId: board.projectId,
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'TODO',
      priority: input.priority ?? 'MEDIUM',
      position: count,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      createdBy: userId,
    });

    await auditService.log({
      userId,
      workspaceId,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: String(task._id),
      metadata: { title: task.title },
      ip,
    });

    const eventId = randomUUID();
    emitBoard('task:created', boardId, { eventId, task });
    await invalidateAnalyticsCache(workspaceId);

    if (task.assigneeId && String(task.assigneeId) !== userId) {
      await enqueueNotification({
        userId: String(task.assigneeId),
        type: 'TASK_ASSIGNED',
        title: 'Task assigned',
        message: `You were assigned to "${task.title}"`,
        entityType: 'Task',
        entityId: String(task._id),
      });
    }

    return task;
  },

  async get(userId: string, id: string) {
    const { task } = await assertTaskAccess(userId, id, 'VIEWER');
    return task;
  },

  async update(userId: string, id: string, input: UpdateTaskInput, ip?: string) {
    const { task, workspaceId, role } = await assertTaskAccess(userId, id, 'MEMBER');

    const isOwnOrAssigned =
      String(task.createdBy) === userId || String(task.assigneeId ?? '') === userId;
    if (ROLE_RANK[role] < ROLE_RANK.ADMIN && !isOwnOrAssigned) {
      throw new ForbiddenError('Can only update own or assigned tasks');
    }

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.status !== undefined) task.status = input.status;
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.position !== undefined) task.position = input.position;
    if (input.assigneeId !== undefined) task.assigneeId = input.assigneeId as never;
    if (input.dueDate !== undefined) {
      task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    await task.save();
    await auditService.log({
      userId,
      workspaceId,
      action: 'TASK_UPDATED',
      entity: 'Task',
      entityId: id,
      metadata: input,
      ip,
    });

    const eventId = randomUUID();
    emitBoard('task:updated', String(task.boardId), { eventId, task });
    await invalidateAnalyticsCache(workspaceId);
    return task;
  },

  async remove(userId: string, id: string, ip?: string) {
    const { task, workspaceId } = await assertTaskAccess(userId, id, 'ADMIN');
    const boardId = String(task.boardId);
    await task.deleteOne();
    await auditService.log({
      userId,
      workspaceId,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: id,
      ip,
    });
    emitBoard('task:deleted', boardId, { eventId: randomUUID(), taskId: id });
    await invalidateAnalyticsCache(workspaceId);
  },

  async move(userId: string, id: string, input: MoveTaskInput, ip?: string) {
    const { task, workspaceId } = await assertTaskAccess(userId, id, 'MEMBER');
    task.status = input.status;
    task.position = input.position;
    await task.save();

    await auditService.log({
      userId,
      workspaceId,
      action: 'TASK_MOVED',
      entity: 'Task',
      entityId: id,
      metadata: { status: input.status, position: input.position },
      ip,
    });

    const eventId = input.mutationId ?? randomUUID();
    emitBoard('task:moved', String(task.boardId), { eventId, mutationId: eventId, task });
    await invalidateAnalyticsCache(workspaceId);
    return task;
  },

  async assign(userId: string, id: string, input: AssignTaskInput) {
    const { task, workspaceId } = await assertTaskAccess(userId, id, 'MEMBER');
    task.assigneeId = input.assigneeId as never;
    await task.save();

    if (input.assigneeId && input.assigneeId !== userId) {
      await enqueueNotification({
        userId: input.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task assigned',
        message: `You were assigned to "${task.title}"`,
        entityType: 'Task',
        entityId: id,
      });
    }

    emitBoard('task:updated', String(task.boardId), { eventId: randomUUID(), task });
    await invalidateAnalyticsCache(workspaceId);
    return task;
  },

  async addAttachment(
    userId: string,
    id: string,
    file: { filename: string; originalname: string; mimetype: string; size: number; path: string },
  ) {
    const { task } = await assertTaskAccess(userId, id, 'MEMBER');
    task.attachments.push({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
    } as never);
    await task.save();
    emitBoard('task:updated', String(task.boardId), { eventId: randomUUID(), task });
    return task;
  },
};
