import type { WorkspaceRole } from './roles.js';

export {
  WORKSPACE_ROLES,
  ROLE_RANK,
  TASK_STATUSES,
  TASK_PRIORITIES,
  CHANNEL_TYPES,
  AUDIT_ACTIONS,
  type WorkspaceRole,
  type TaskStatus,
  type TaskPriority,
  type ChannelType,
  type AuditAction,
} from './roles.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface RequestAuth {
  user?: AuthUser;
  workspaceRole?: WorkspaceRole;
  requestId?: string;
}
