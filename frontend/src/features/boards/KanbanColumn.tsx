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
        'flex min-h-[420px] flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40',
        isOver && 'border-brand-400 bg-brand-50/40 dark:bg-brand-950/20',
      )}
      data-testid={`column-${status}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-semibold">{titles[status]}</h3>
          <p className="text-xs text-slate-500">{tasks.length} tasks</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800"
          aria-label={`Add task to ${titles[status]}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
