import { z } from 'zod';
import { Project } from '../projects/project.model.js';
import { Task } from '../tasks/task.model.js';
import { Comment } from '../comments/comment.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { ValidationError } from '../../utils/errors.js';

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

    const projects = await Project.find({
      workspaceId: { $in: workspaceIds },
      $text: { $search: q },
    })
      .select({ score: { $meta: 'textScore' }, name: 1, description: 1, workspaceId: 1 })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    const projectIds = await Project.find({ workspaceId: { $in: workspaceIds } }).distinct('_id');

    const tasks = await Task.find({
      projectId: { $in: projectIds },
      $text: { $search: q },
    })
      .select({ score: { $meta: 'textScore' }, title: 1, description: 1, boardId: 1, projectId: 1 })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    const taskIds = await Task.find({ projectId: { $in: projectIds } }).distinct('_id');
    const comments = await Comment.find({
      taskId: { $in: taskIds },
      $text: { $search: q },
    })
      .select({ score: { $meta: 'textScore' }, content: 1, taskId: 1, userId: 1 })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    return { projects, tasks, comments };
  },
};
