import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { ActivityFeed, RecentProjects } from '@/features/dashboard/DashboardPanels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useWorkspaceSocket } from '@/hooks/useSocket';
import { LoadingPage } from '@/components/common/LoadingPage';

export function DashboardPage() {
  const { workspaceId } = useParams();
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const projects = useWorkspaceStore((s) => s.projects);
  const analytics = useWorkspaceStore((s) => s.analytics);
  const activity = useWorkspaceStore((s) => s.activity);
  const loading = useWorkspaceStore((s) => s.loading);
  const analyticsLoading = useWorkspaceStore((s) => s.analyticsLoading);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId) void selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  useWorkspaceSocket(workspaceId ?? current?.id);

  if (!workspaceId && current) {
    return <Navigate to={`/workspaces/${current.id}`} replace />;
  }

  if (!workspaceId && !current && !loading && workspaces.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <h1 className="font-display text-2xl font-semibold">Welcome to WorkSpace</h1>
        <p className="mt-2 text-sm text-slate-500">
          You are not a member of any workspace yet. Ask an admin to invite you, or create one via
          the API.
        </p>
      </div>
    );
  }

  if (!current && loading) return <LoadingPage label="Loading workspace…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {current?.name ?? 'Dashboard'}
        </h1>
        <p className="text-sm text-slate-500">Overview of projects, tasks, and recent activity.</p>
      </div>
      <DashboardStats analytics={analytics} loading={analyticsLoading} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="mb-3 font-display text-base font-semibold">Recent projects</h2>
          <RecentProjects projects={projects} loading={loading && !projects.length} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="mb-3 font-display text-base font-semibold">Activity</h2>
          <ActivityFeed activity={activity} loading={loading && !activity.length} />
        </section>
      </div>
    </div>
  );
}
