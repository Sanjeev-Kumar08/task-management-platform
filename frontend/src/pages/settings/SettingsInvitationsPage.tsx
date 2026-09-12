import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { inviteSchema, type InviteFormValues } from '@/lib/validators';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import * as invitationService from '@/services/invitation.service';
import type { Invitation } from '@/types';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';
import { formatRelativeTime } from '@/utils/format';

export function SettingsInvitationsPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const role = myWorkspaceRole(workspace, user?.id);
  const canManage = canManageMembers(role);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const load = useCallback(async () => {
    if (!workspace || !canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await invitationService.listInvitations(workspace.id);
      setInvites(data);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to load invitations', 'error');
    } finally {
      setLoading(false);
    }
  }, [workspace, canManage, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500">Only owners and admins can manage invitations.</p>
    );
  }

  if (!workspace) return <p className="text-sm text-slate-500">Loading…</p>;

  const onInvite = handleSubmit(async (values) => {
    try {
      const created = await invitationService.createInvitation(workspace.id, values);
      pushToast(
        created.inviteUrl
          ? `Invitation sent. Dev link: ${created.inviteUrl}`
          : 'Invitation sent',
        'success',
      );
      reset({ email: '', role: 'MEMBER' });
      await load();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Invite failed', 'error');
    }
  });

  const resend = async (id: string) => {
    setBusyId(id);
    try {
      await invitationService.resendInvitation(workspace.id, id);
      pushToast('Invitation resent', 'success');
      await load();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Resend failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (id: string) => {
    setBusyId(id);
    try {
      await invitationService.revokeInvitation(workspace.id, id);
      pushToast('Invitation revoked', 'success');
      await load();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Revoke failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Invitations</h2>
        <p className="text-sm text-slate-500">Invite people by email — they do not need an account yet.</p>
      </div>
      <form onSubmit={onInvite} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]" noValidate>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Select
          label="Role"
          options={[
            { value: 'ADMIN', label: 'Admin' },
            { value: 'MEMBER', label: 'Member' },
            { value: 'VIEWER', label: 'Viewer' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />
        <div className="flex items-end">
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Send invite
          </Button>
        </div>
      </form>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Pending</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-slate-500">No pending invitations.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-slate-500">
                    {inv.role} · expires {formatRelativeTime(inv.expiresAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === inv.id}
                  onClick={() => void resend(inv.id)}
                >
                  Resend
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === inv.id}
                  onClick={() => void revoke(inv.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
