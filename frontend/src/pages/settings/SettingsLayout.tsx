import { NavLink, Outlet, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';
import { useEffect } from 'react';
import { transition } from '@/lib/motion';

const tabs = [
  { to: 'general', label: 'General', adminOnly: false },
  { to: 'members', label: 'Members', adminOnly: false },
  { to: 'invitations', label: 'Invitations', adminOnly: true },
  { to: 'billing', label: 'Billing', adminOnly: false },
  { to: 'account', label: 'Account', adminOnly: false },
  { to: 'security', label: 'Security', adminOnly: false },
] as const;

export function SettingsLayout() {
  const { workspaceId } = useParams();
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const user = useAuthStore((s) => s.user);
  const role = myWorkspaceRole(current, user?.id);
  const showAdmin = canManageMembers(role);

  useEffect(() => {
    void fetchWorkspaces({ preferId: workspaceId });
  }, [fetchWorkspaces, workspaceId]);

  useEffect(() => {
    if (workspaceId && current?.id !== workspaceId) {
      void selectWorkspace(workspaceId).catch(() => undefined);
    }
  }, [workspaceId, current?.id, selectWorkspace]);

  const base = workspaceId ? `/workspaces/${workspaceId}/settings` : '/settings';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
          Workspace
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage workspace, members, billing, and your account.
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
          {tabs
            .filter((t) => !t.adminOnly || showAdmin)
            .map((tab) => (
              <NavLink
                key={tab.to}
                to={`${base}/${tab.to}`}
                className={({ isActive }) =>
                  cn(
                    'relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                    isActive && 'text-brand-800 dark:text-brand-200',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        layoutId="settings-tab"
                        className="absolute inset-0 rounded-xl bg-brand-50 dark:bg-brand-950/50"
                        transition={transition}
                      />
                    ) : null}
                    <span className="relative z-10">{tab.label}</span>
                  </>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="app-panel min-w-0 flex-1 p-5 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
