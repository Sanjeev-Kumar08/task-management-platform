import { Link } from 'react-router-dom';
import { FolderKanban, CheckCircle2, ListTodo, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WorkspaceAnalytics } from '@/types';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { cn } from '@/utils/cn';

const cards = [
  {
    key: 'totalProjects' as const,
    label: 'Projects',
    icon: FolderKanban,
    accent: 'text-brand-600 bg-brand-50 dark:bg-brand-950/50 dark:text-brand-300',
    href: (workspaceId: string) => `/workspaces/${workspaceId}/projects`,
  },
  {
    key: 'totalTasks' as const,
    label: 'Tasks',
    icon: ListTodo,
    accent: 'text-ink-600 bg-ink-50 dark:bg-ink-950/40 dark:text-ink-300',
    href: (workspaceId: string) => `/workspaces/${workspaceId}/tasks`,
  },
  {
    key: 'completedTasks' as const,
    label: 'Completed',
    icon: CheckCircle2,
    accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
    href: (workspaceId: string) => `/workspaces/${workspaceId}/tasks?status=DONE`,
  },
  {
    key: 'overdueTasks' as const,
    label: 'Overdue',
    icon: AlertTriangle,
    accent: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
    href: null as ((workspaceId: string) => string) | null,
  },
];

export function DashboardStats({
  analytics,
  loading,
  workspaceId,
}: {
  analytics: WorkspaceAnalytics | null;
  loading: boolean;
  workspaceId?: string;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {cards.map(({ key, label, icon: Icon, accent, href }) => {
        const to = workspaceId && href ? href(workspaceId) : null;
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', accent)}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight tabular-nums">
              {analytics?.[key] ?? 0}
            </p>
          </>
        );

        return (
          <motion.div
            key={key}
            variants={staggerItem}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {to ? (
              <Link
                to={to}
                className="app-panel block p-5 transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:hover:border-brand-700"
              >
                {content}
              </Link>
            ) : (
              <div className="app-panel p-5">{content}</div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
