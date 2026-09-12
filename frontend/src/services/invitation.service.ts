import { request } from '@/lib/api';
import type { Invitation, InvitationPreview, Workspace, WorkspaceRole } from '@/types';

export function listInvitations(workspaceId: string) {
  return request<Invitation[]>({
    method: 'GET',
    url: `/api/workspaces/${workspaceId}/invitations`,
  });
}

export function createInvitation(
  workspaceId: string,
  input: { email: string; role: Exclude<WorkspaceRole, 'OWNER'> },
) {
  return request<Invitation>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/invitations`,
    data: input,
  });
}

export function resendInvitation(workspaceId: string, inviteId: string) {
  return request<{ id: string; expiresAt: string }>({
    method: 'POST',
    url: `/api/workspaces/${workspaceId}/invitations/${inviteId}/resend`,
  });
}

export function revokeInvitation(workspaceId: string, inviteId: string) {
  return request<null>({
    method: 'DELETE',
    url: `/api/workspaces/${workspaceId}/invitations/${inviteId}`,
  });
}

export function previewInvitation(token: string) {
  return request<InvitationPreview>({ method: 'GET', url: `/api/invitations/${token}` });
}

export function acceptInvitation(token: string) {
  return request<Workspace>({ method: 'POST', url: `/api/invitations/${token}/accept` });
}

export function openInvitation(inviteId: string) {
  return request<{ path: string; inviteUrl: string }>({
    method: 'POST',
    url: `/api/invitations/by-id/${inviteId}/open`,
  });
}
