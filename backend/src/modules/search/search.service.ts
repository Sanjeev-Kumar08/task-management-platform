import { Project } from '../projects/project.model.js';
import { Task } from '../tasks/task.model.js';
import { Comment } from '../comments/comment.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { ValidationError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';
import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  workspaceId: z.string().optional(),
});

export const searchService = {
  async search(userId: string, q: string, workspaceId?: string) {
    if (!q.trim()) throw new ValidationError('Query required');

    const memberships = await Workspace.find({ 'members.userId': userId }).select('_id').lean();
    let workspaceIds = memberships.map((w) => w._id);
    if (workspaceId) {
      workspaceIds = workspaceIds.filter((id) => String(id) === workspaceId);
    }

    const projectIds = await Project.find({ workspaceId: { $in: workspaceIds } }).distinct('_id');
    const taskIds = await Task.find({ projectId: { $in: projectIds } }).distinct('_id');
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    try {
      const [projects, tasks, comments] = await Promise.all([
        Project.find({ workspaceId: { $in: workspaceIds }, $text: { $search: q } })
          .select({ name: 1, description: 1, workspaceId: 1 })
          .limit(20)
          .lean(),
        Task.find({ projectId: { $in: projectIds }, $text: { $search: q } })
          .select({ title: 1, description: 1, boardId: 1, projectId: 1 })
          .limit(20)
          .lean(),
        Comment.find({ taskId: { $in: taskIds }, $text: { $search: q } })
          .select({ content: 1, taskId: 1, userId: 1 })
          .limit(20)
          .lean(),
      ]);
      return { projects, tasks, comments };
    } catch (err) {
      logger.warn({ err }, 'Text search unavailable; falling back to regex');
      const [projects, tasks, comments] = await Promise.all([
        Project.find({
          workspaceId: { $in: workspaceIds },
          $or: [{ name: rx }, { description: rx }],
        })
          .limit(20)
          .lean(),
        Task.find({
          projectId: { $in: projectIds },
          $or: [{ title: rx }, { description: rx }],
        })
          .limit(20)
          .lean(),
        Comment.find({ taskId: { $in: taskIds }, content: rx }).limit(20).lean(),
      ]);
      return { projects, tasks, comments };
    }
  },
};
