import mongoose from 'mongoose';
import { Project } from '../projects/project.model.js';
import { Task } from '../tasks/task.model.js';
import { getCachedAnalytics, setCachedAnalytics } from './analytics.cache.js';
import { workspaceService } from './workspace.service.js';

export interface WorkspaceAnalytics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  tasksByAssignee: Array<{ assigneeId: string | null; count: number }>;
}

export const analyticsService = {
  async getWorkspaceAnalytics(userId: string, workspaceId: string): Promise<WorkspaceAnalytics> {
    await workspaceService.assertRole(userId, workspaceId, 'VIEWER');

    const cached = await getCachedAnalytics<WorkspaceAnalytics>(workspaceId);
    if (cached) return cached;

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    const now = new Date();

    const [result] = await Project.aggregate<WorkspaceAnalytics>([
      { $match: { workspaceId: workspaceObjectId } },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'tasks',
        },
      },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          allTasks: { $push: '$tasks' },
        },
      },
      {
        $project: {
          _id: 0,
          totalProjects: 1,
          tasks: {
            $reduce: {
              input: '$allTasks',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] },
            },
          },
        },
      },
      {
        $project: {
          totalProjects: 1,
          totalTasks: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 't',
                cond: { $eq: ['$$t.status', 'DONE'] },
              },
            },
          },
          overdueTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 't',
                cond: {
                  $and: [
                    { $ne: ['$$t.dueDate', null] },
                    { $lt: ['$$t.dueDate', now] },
                    { $ne: ['$$t.status', 'DONE'] },
                  ],
                },
              },
            },
          },
          tasks: 1,
        },
      },
    ]);

    const tasks = await Task.find({
      projectId: { $in: await Project.find({ workspaceId }).distinct('_id') },
    }).lean();

    const byStatus = new Map<string, number>();
    const byPriority = new Map<string, number>();
    const byAssignee = new Map<string, number>();

    for (const t of tasks) {
      byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
      byPriority.set(t.priority, (byPriority.get(t.priority) ?? 0) + 1);
      const key = t.assigneeId ? String(t.assigneeId) : 'unassigned';
      byAssignee.set(key, (byAssignee.get(key) ?? 0) + 1);
    }

    const analytics: WorkspaceAnalytics = {
      totalProjects: result?.totalProjects ?? 0,
      totalTasks: result?.totalTasks ?? tasks.length,
      completedTasks: result?.completedTasks ?? 0,
      overdueTasks: result?.overdueTasks ?? 0,
      tasksByStatus: [...byStatus.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      tasksByPriority: [...byPriority.entries()]
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => b.count - a.count),
      tasksByAssignee: [...byAssignee.entries()]
        .map(([assigneeId, count]) => ({
          assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    };

    // Additional aggregation for status grouping (demonstrates $group/$sort)
    const statusAgg = await Task.aggregate([
      {
        $match: {
          projectId: {
            $in: await Project.find({ workspaceId: workspaceObjectId }).distinct('_id'),
          },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    if (statusAgg.length) {
      analytics.tasksByStatus = statusAgg;
    }

    await setCachedAnalytics(workspaceId, analytics);
    return analytics;
  },
};
