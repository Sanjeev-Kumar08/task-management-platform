import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import * as workspaceService from '@/services/workspace.service';
import {
  canManageMembers,
  memberUser,
  memberUserId,
  myWorkspaceRole,
} from '@/utils/members';
import type { WorkspaceRole } from '@/types';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
];

export function SettingsMembersPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const refresh = useWorkspaceStore((s) => s.refreshCurrentWorkspace);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const clearCurrent = useWorkspaceStore((s) => s.clearCurrentWorkspace);
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const role = myWorkspaceRole(workspace, user?.id);
  const canManage = canManageMembers(role);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!workspace || !user) {
    return <p className="text-sm text-slate-500">Loading members…</p>;
  }

  const changeRole = async (memberId: string, next: Exclude<WorkspaceRole, 'OWNER'>) => {
    setBusyId(memberId);
    try {
      await workspaceService.changeMemberRole(workspace.id, memberId, next);
      await refresh();
      pushToast('Role updated', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to change role', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (memberId: string) => {
    const ok = await confirmDialog({
      title: 'Remove member',
      description: 'Remove this member from the workspace?',
      confirmLabel: 'Remove member',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(memberId);
    try {
      await workspaceService.removeMember(workspace.id, memberId);
      await refresh();
      pushToast('Member removed', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to remove member', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const leave = async () => {
    const ok = await confirmDialog({
      title: 'Leave workspace',
      description: 'Leave this workspace? You will lose access until invited again.',
      confirmLabel: 'Leave workspace',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(user.id);
    try {
      await workspaceService.leaveWorkspace(workspace.id);
      clearCurrent();
      await fetchWorkspaces();
      pushToast('You left the workspace', 'success');
      navigate('/dashboard');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to leave', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const transfer = async (newOwnerId: string) => {
    const ok = await confirmDialog({
      title: 'Transfer ownership',
      description: 'Transfer ownership to this member? You will become an admin.',
      confirmLabel: 'Transfer ownership',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(newOwnerId);
    try {
      await workspaceService.transferOwnership(workspace.id, newOwnerId);
      await refresh();
      pushToast('Ownership transferred', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Transfer failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Members</h2>
        <p className="text-sm text-slate-500">
          Roles: Owner (full control), Admin (manage members/settings), Member (collaborate),
          Viewer (read-only).
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {workspace.members.map((m) => {
          const mu = memberUser(m);
          const mid = memberUserId(m);
          const isSelf = mid === user.id;
          const isOwner = m.role === 'OWNER';
          return (
            <li key={mid} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar name={mu.name} src={mu.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {mu.name}
                  {isSelf ? ' (you)' : ''}
                </p>
                <p className="text-xs text-slate-500">{mu.email || mid}</p>
              </div>
              {isOwner || !canManage || isSelf ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">
                  {m.role}
                </span>
              ) : (
                <Select
                  className="w-32"
                  options={ROLE_OPTIONS}
                  value={m.role}
                  disabled={busyId === mid}
                  onChange={(e) =>
                    void changeRole(mid, e.target.value as Exclude<WorkspaceRole, 'OWNER'>)
                  }
                />
              )}
              {canManage && !isOwner && !isSelf ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === mid}
                  onClick={() => void remove(mid)}
                >
                  Remove
                </Button>
              ) : null}
              {role === 'OWNER' && !isOwner ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === mid}
                  onClick={() => void transfer(mid)}
                >
                  Make owner
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {role !== 'OWNER' ? (
        <Button variant="danger" loading={busyId === user.id} onClick={() => void leave()}>
          Leave workspace
        </Button>
      ) : (
        <p className="text-xs text-slate-500">
          Transfer ownership before leaving if you are the only owner.
        </p>
      )}
    </div>
  );
}
