import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import * as authService from '@/services/auth.service';
import { formatDate, formatRelativeTime } from '@/utils/format';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const pushToast = useUiStore((s) => s.pushToast);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const save = async () => {
    if (!name.trim()) {
      pushToast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name: name.trim() });
      if (accessToken) setSession(updated, accessToken);
      else useAuthStore.setState({ user: updated });
      pushToast('Profile updated', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Logout failed', 'error');
    } finally {
      setLoggingOut(false);
    }
  };

  const securityHref = workspace
    ? `/workspaces/${workspace.id}/settings/security`
    : '/dashboard';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 dark:text-brand-200">
          Account
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account details and session.</p>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-6 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar name={user.name} src={user.avatar} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold tracking-tight">{user.name}</h2>
              <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
              {user.status ? (
                <span className="mt-2 inline-flex rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
                  {user.status}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-950">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.email}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-950">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Member since</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:col-span-2 dark:border-slate-700 dark:bg-slate-950">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Last login</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '—'}
              </dd>
            </div>
          </dl>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Edit profile</h3>
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Input label="Email" value={user.email} disabled />
            <Button onClick={() => void save()} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </div>

      <div className="app-panel space-y-3 p-5 sm:p-6">
        <h3 className="font-display text-base font-semibold">Quick actions</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {workspace ? (
            <Link
              to={`/workspaces/${workspace.id}/settings`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4" />
              Workspace settings
            </Link>
          ) : null}
          <Link
            to={securityHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <KeyRound className="h-4 w-4" />
            Security
          </Link>
          <Button
            variant="danger"
            loading={loggingOut}
            onClick={() => void onLogout()}
            className="sm:ml-auto"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
