import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/utils/format';
import type { AuditLog, Project } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FolderKanban, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { staggerContainer, staggerItem } from '@/lib/motion';

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
    <motion.ul
      className="divide-y divide-slate-100 dark:divide-slate-800/80"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {projects.slice(0, 6).map((p) => (
        <motion.li key={p.id} variants={staggerItem}>
          <Link
            to={`/projects/${p.id}`}
            className="-mx-2 flex items-start justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
          >
            <div className="min-w-0">
              <p className="font-medium tracking-tight">{p.name}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                {p.description || 'No description'}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(p.updatedAt)}
            </span>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
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
    <motion.ul
      className="space-y-1"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {activity.slice(0, 10).map((a) => (
        <motion.li
          key={a.id}
          variants={staggerItem}
          className="flex items-start gap-3 rounded-xl px-2 py-2.5 text-sm"
        >
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
          <div className="min-w-0">
            <p className="font-medium tracking-tight capitalize">
              {a.action.replaceAll('_', ' ').toLowerCase()}
            </p>
            <p className="text-xs text-slate-500">
              {a.entity} · {formatRelativeTime(a.createdAt)}
            </p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
