import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/utils/format';
import type { AuditLog, Project } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderKanban, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export function RecentProjects({ projects, loading }: { projects: Project[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create a project to start organizing work."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {projects.slice(0, 6).map((p) => (
        <li key={p.id}>
          <Link
            to={`/projects/${p.id}`}
            className="flex items-start justify-between gap-3 py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                {p.description || 'No description'}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(p.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActivityFeed({ activity, loading }: { activity: AuditLog[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!activity.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Workspace actions will show up here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {activity.slice(0, 10).map((a) => (
        <li key={a.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          <div>
            <p className="font-medium">{a.action.replaceAll('_', ' ')}</p>
            <p className="text-xs text-slate-500">
              {a.entity} · {formatRelativeTime(a.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
