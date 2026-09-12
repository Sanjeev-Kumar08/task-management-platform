import { ForbiddenError } from '../../utils/errors.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { Project } from '../projects/project.model.js';
import { Task } from '../tasks/task.model.js';
import { Subscription } from '../billing/subscription.model.js';
import { PLAN_LIMITS, type PlanId, type PlanLimits } from './plans.js';

async function resolveOwnerPlan(ownerId: string): Promise<PlanId> {
  const sub = await Subscription.findOne({
    ownerId,
    status: { $in: ['active', 'trialing', 'past_due'] },
  }).lean();
  if (!sub) return 'free';
  return (sub.planId as PlanId) || 'free';
}

async function resolveWorkspacePlan(workspaceId: string): Promise<{ planId: PlanId; limits: PlanLimits; ownerId: string }> {
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) {
    return { planId: 'free', limits: PLAN_LIMITS.free, ownerId: '' };
  }
  const ownerId = String(workspace.ownerId);
  const planId = await resolveOwnerPlan(ownerId);
  return { planId, limits: PLAN_LIMITS[planId], ownerId };
}

export const entitlementsService = {
  async getLimitsForOwner(ownerId: string): Promise<{ planId: PlanId; limits: PlanLimits }> {
    const planId = await resolveOwnerPlan(ownerId);
    return { planId, limits: PLAN_LIMITS[planId] };
  },

  async getLimitsForWorkspace(workspaceId: string) {
    return resolveWorkspacePlan(workspaceId);
  },

  async assertCanCreateWorkspace(userId: string): Promise<void> {
    const { planId, limits } = await this.getLimitsForOwner(userId);
    const count = await Workspace.countDocuments({ ownerId: userId });
    if (count >= limits.maxWorkspaces) {
      throw new ForbiddenError(
        `Workspace limit reached for ${planId} plan (${limits.maxWorkspaces}). Upgrade to continue.`,
      );
    }
  },

  async assertCanAddMember(workspaceId: string): Promise<void> {
    const { planId, limits } = await resolveWorkspacePlan(workspaceId);
    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) return;
    if (workspace.members.length >= limits.maxMembersPerWorkspace) {
      throw new ForbiddenError(
        `Member limit reached for ${planId} plan (${limits.maxMembersPerWorkspace}). Upgrade to continue.`,
      );
    }
  },

  async assertCanCreateProject(workspaceId: string): Promise<void> {
    const { planId, limits } = await resolveWorkspacePlan(workspaceId);
    const count = await Project.countDocuments({ workspaceId, archived: { $ne: true } });
    if (count >= limits.maxProjectsPerWorkspace) {
      throw new ForbiddenError(
        `Project limit reached for ${planId} plan (${limits.maxProjectsPerWorkspace}). Upgrade to continue.`,
      );
    }
  },

  async assertCanCreateTask(workspaceId: string): Promise<void> {
    const { planId, limits } = await resolveWorkspacePlan(workspaceId);
    const projects = await Project.find({ workspaceId }).select('_id').lean();
    const projectIds = projects.map((p) => p._id);
    const count = await Task.countDocuments({ projectId: { $in: projectIds } });
    if (count >= limits.maxTasksPerWorkspace) {
      throw new ForbiddenError(
        `Task limit reached for ${planId} plan (${limits.maxTasksPerWorkspace}). Upgrade to continue.`,
      );
    }
  },

  async assertStorageAllowance(workspaceId: string, additionalBytes: number): Promise<void> {
    const { planId, limits } = await resolveWorkspacePlan(workspaceId);
    const projects = await Project.find({ workspaceId }).select('_id').lean();
    const projectIds = projects.map((p) => p._id);
    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .select('attachments')
      .lean();
    const used = tasks.reduce(
      (sum, t) => sum + (t.attachments ?? []).reduce((s, a) => s + (a.size ?? 0), 0),
      0,
    );
    if (used + additionalBytes > limits.maxStorageBytes) {
      throw new ForbiddenError(
        `Storage limit reached for ${planId} plan. Upgrade to continue.`,
      );
    }
  },
};
