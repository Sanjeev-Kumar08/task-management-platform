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
  'WORKSPACE_DELETED',
  'WORKSPACE_UPDATED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'MEMBER_INVITED',
  'MEMBER_ROLE_CHANGED',
  'OWNERSHIP_TRANSFERRED',
  'MEMBER_LEFT',
  'INVITATION_ACCEPTED',
  'INVITATION_REVOKED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'PROJECT_ARCHIVED',
  'BOARD_CREATED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_MOVED',
  'TASK_DELETED',
  'COMMENT_CREATED',
  'COMMENT_UPDATED',
  'CHANNEL_CREATED',
  'CHANNEL_UPDATED',
  'CHANNEL_DELETED',
  'BILLING_UPDATED',
  'ACCOUNT_DELETED',
  'PASSWORD_CHANGED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
