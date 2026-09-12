import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TaskCard } from '@/features/boards/TaskCard';
import type { Task, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

const titles: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

const accents: Record<TaskStatus, string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-sky-500',
  DONE: 'bg-emerald-500',
};

export function KanbanColumn({
  status,
  tasks,
  onOpenTask,
  onAdd,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onAdd: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-2xl bg-slate-100/70 p-2.5 transition-[background-color,box-shadow] duration-200 dark:bg-slate-900/50 lg:w-auto',
        isOver && 'bg-brand-50/80 ring-2 ring-brand-400/40 dark:bg-brand-950/30',
      )}
      data-testid={`column-${status}`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1.5 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', accents[status])} />
          <h3 className="truncate text-sm font-semibold tracking-tight">{titles[status]}</h3>
          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-500 dark:bg-slate-800/80">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label={`Add task to ${titles[status]}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[360px] flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
          {!tasks.length ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200/80 px-3 py-8 text-center text-xs text-slate-400 dark:border-slate-700/80">
              Drop tasks here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}
