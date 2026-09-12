export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const CHANNEL_TYPES = ['PUBLIC', 'PRIVATE'] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const AUDIT_ACTIONS = [
  'WORKSPACE_CREATED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'BOARD_CREATED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_MOVED',
  'TASK_DELETED',
  'COMMENT_CREATED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
