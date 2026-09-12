export type PlanId = 'free' | 'pro' | 'business';

export interface PlanLimits {
  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxProjectsPerWorkspace: number;
  maxStorageBytes: number;
  maxTasksPerWorkspace: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxWorkspaces: 3,
    maxMembersPerWorkspace: 10,
    maxProjectsPerWorkspace: 20,
    maxStorageBytes: 500 * 1024 * 1024,
    maxTasksPerWorkspace: 500,
  },
  pro: {
    maxWorkspaces: 20,
    maxMembersPerWorkspace: 50,
    maxProjectsPerWorkspace: 200,
    maxStorageBytes: 20 * 1024 * 1024 * 1024,
    maxTasksPerWorkspace: 10_000,
  },
  business: {
    maxWorkspaces: 100,
    maxMembersPerWorkspace: 500,
    maxProjectsPerWorkspace: 2000,
    maxStorageBytes: 200 * 1024 * 1024 * 1024,
    maxTasksPerWorkspace: 100_000,
  },
};

export const PLAN_CATALOG = [
  {
    id: 'free' as const,
    name: 'Free',
    priceMonthly: 0,
    description: 'For individuals and small teams getting started',
    limits: PLAN_LIMITS.free,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    priceMonthly: 12,
    description: 'For growing teams that need more capacity',
    limits: PLAN_LIMITS.pro,
  },
  {
    id: 'business' as const,
    name: 'Business',
    priceMonthly: 29,
    description: 'For organizations with advanced collaboration needs',
    limits: PLAN_LIMITS.business,
  },
];
