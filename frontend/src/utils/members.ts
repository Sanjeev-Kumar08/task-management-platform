import type { User, Workspace, WorkspaceMember, WorkspaceRole } from '@/types';
import { asUserRef } from '@/utils/normalize';

export function memberUserId(member: WorkspaceMember): string {
  return asUserRef(member.userId).id;
}

export function memberUser(member: WorkspaceMember): User {
  const ref = asUserRef(member.userId);
  return {
    id: ref.id,
    name: ref.name,
    email: ref.email,
    avatar: ref.avatar,
  };
}

export function myWorkspaceRole(
  workspace: Workspace | null | undefined,
  userId: string | undefined,
): WorkspaceRole | null {
  if (!workspace || !userId) return null;
  const member = workspace.members.find((m) => memberUserId(m) === userId);
  return member?.role ?? null;
}

export function canManageMembers(role: WorkspaceRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function canDeleteProject(
  role: WorkspaceRole | null,
  createdBy: string,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return canManageMembers(role) || createdBy === userId;
}
