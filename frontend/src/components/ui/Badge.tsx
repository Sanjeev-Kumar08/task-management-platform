import { cn } from '@/utils/cn';
import type { TaskPriority, TaskStatus } from '@/types';

const priorityStyles: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM:
    'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50',
  HIGH: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50',
  URGENT:
    'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/50',
};

const statusStyles: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS:
    'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50',
  DONE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50',
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={priorityStyles[priority]}>{priority.replace('_', ' ')}</Badge>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>;
}
