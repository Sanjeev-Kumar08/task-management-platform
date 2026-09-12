import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { ActivityFeed, RecentProjects } from '@/features/dashboard/DashboardPanels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useWorkspaceSocket } from '@/hooks/useSocket';
import { LoadingPage } from '@/components/common/LoadingPage';
import { Button } from '@/components/ui/Button';
import { CreateWorkspaceDialog } from '@/features/workspace/CreateWorkspaceDialog';
import { staggerContainer, staggerItem } from '@/lib/motion';

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
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void fetchWorkspaces({ preferId: workspaceId });
  }, [fetchWorkspaces, workspaceId]);

  useEffect(() => {
    if (workspaceId && current?.id !== workspaceId) {
      void selectWorkspace(workspaceId).catch(() => undefined);
    }
  }, [workspaceId, current?.id, selectWorkspace]);

  useWorkspaceSocket(workspaceId ?? current?.id);

  if (!workspaceId && current) {
    return <Navigate to={`/workspaces/${current.id}`} replace />;
  }

  if (!workspaceId && !current && !loading && workspaces.length === 0) {
    return (
      <>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mx-auto flex max-w-lg flex-col items-center text-center"
        >
          <motion.div
            variants={staggerItem}
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-display text-xl font-bold text-white shadow-lift"
          >
            W
          </motion.div>
          <motion.h1 variants={staggerItem} className="font-display text-3xl font-semibold tracking-tight">
            Welcome to WorkSpace
          </motion.h1>
          <motion.p variants={staggerItem} className="mt-2 text-sm leading-relaxed text-slate-500">
            Create a workspace for your team, or accept an invitation from a teammate.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-7">
            <Button onClick={() => setCreateOpen(true)}>Create workspace</Button>
          </motion.div>
        </motion.div>
        <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    );
  }

  if (!current && loading) return <LoadingPage label="Loading workspace…" />;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
            Dashboard
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {current?.name ?? 'Dashboard'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            {current?.description || 'Overview of projects, tasks, and recent activity.'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          New workspace
        </Button>
      </div>
      <DashboardStats
        analytics={analytics}
        loading={analyticsLoading}
        workspaceId={workspaceId ?? current?.id}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="app-panel p-5 md:p-6">
          <h2 className="mb-4 font-display text-base font-semibold tracking-tight">Recent projects</h2>
          <RecentProjects projects={projects} loading={loading && !projects.length} />
        </section>
        <section className="app-panel p-5 md:p-6">
          <h2 className="mb-4 font-display text-base font-semibold tracking-tight">Activity</h2>
          <ActivityFeed activity={activity} loading={loading && !activity.length} />
        </section>
      </div>
      <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
