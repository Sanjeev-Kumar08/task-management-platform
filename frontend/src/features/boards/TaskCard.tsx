import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge } from '@/components/ui/Badge';
import type { Task } from '@/types';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={cn(
        'w-full rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-sm transition duration-150 hover:border-slate-300 dark:border-slate-700/70 dark:bg-slate-950 dark:hover:border-slate-600',
        isDragging && 'opacity-40 shadow-none ring-2 ring-brand-400/50',
      )}
      onClick={() => onOpen(task.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-100">
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {task.description}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
        {task.attachments?.length ? <span>{task.attachments.length} file(s)</span> : null}
      </div>
    </button>
  );
}
