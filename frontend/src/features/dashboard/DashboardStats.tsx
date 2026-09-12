import { FolderKanban, CheckCircle2, ListTodo, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WorkspaceAnalytics } from '@/types';

const cards = [
  { key: 'totalProjects' as const, label: 'Projects', icon: FolderKanban },
  { key: 'totalTasks' as const, label: 'Tasks', icon: ListTodo },
  { key: 'completedTasks' as const, label: 'Completed', icon: CheckCircle2 },
  { key: 'overdueTasks' as const, label: 'Overdue', icon: AlertTriangle },
];

export function DashboardStats({
  analytics,
  loading,
}: {
  analytics: WorkspaceAnalytics | null;
  loading: boolean;
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <Icon className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {analytics?.[key] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
