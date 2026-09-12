import { randomUUID } from 'node:crypto';
import { Comment } from './comment.model.js';
import { Task } from '../tasks/task.model.js';
import { Project } from '../projects/project.model.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { auditService } from '../audit/audit.service.js';
import { enqueueNotification } from '../../jobs/queues.js';
import { getIO } from '../../sockets/io.js';
import type { CreateCommentInput } from './comment.validation.js';

export const commentService = {
  async list(userId: string, taskId: string) {
    const task = await Task.findById(taskId).lean();
    if (!task) throw new NotFoundError('Task not found');
    const project = await Project.findById(task.projectId).lean();
    if (!project) throw new NotFoundError('Project not found');
    await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
    return Comment.find({ taskId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email avatar')
      .lean();
  },

  async create(userId: string, taskId: string, input: CreateCommentInput, ip?: string) {
    const task = await Task.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    const project = await Project.findById(task.projectId).lean();
    if (!project) throw new NotFoundError('Project not found');
    await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');

    const comment = await Comment.create({
      taskId,
      userId,
      content: input.content,
    });

    await auditService.log({
      userId,
      workspaceId: String(project.workspaceId),
      action: 'COMMENT_CREATED',
      entity: 'Comment',
      entityId: String(comment._id),
      metadata: { taskId },
      ip,
    });

    const populated = await Comment.findById(comment._id).populate('userId', 'name email avatar');
    getIO()
      ?.to(`board:${String(task.boardId)}`)
      .emit('comment:created', {
        eventId: randomUUID(),
        comment: populated,
      });

    const notifyUserId = task.assigneeId ? String(task.assigneeId) : String(task.createdBy);
    if (notifyUserId !== userId) {
      await enqueueNotification({
        userId: notifyUserId,
        type: 'COMMENT_ADDED',
        title: 'New comment',
        message: `New comment on "${task.title}"`,
        entityType: 'Task',
        entityId: taskId,
      });
    }

    return populated;
  },

  async remove(userId: string, id: string) {
    const comment = await Comment.findById(id);
    if (!comment) throw new NotFoundError('Comment not found');
    if (String(comment.userId) !== userId) {
      throw new ForbiddenError('Can only delete your own comments');
    }
    await comment.deleteOne();
  },
};
