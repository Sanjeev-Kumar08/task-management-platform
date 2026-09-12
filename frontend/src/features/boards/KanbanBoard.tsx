import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from '@/features/boards/KanbanColumn';
import { TaskCard } from '@/features/boards/TaskCard';
import { useBoardStore } from '@/stores/boardStore';
import type { Task, TaskStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export function KanbanBoard() {
  const tasks = useBoardStore((s) => s.tasks);
  const loading = useBoardStore((s) => s.loading);
  const board = useBoardStore((s) => s.board);
  const selectTask = useBoardStore((s) => s.selectTask);
  const moveTaskOptimistic = useBoardStore((s) => s.moveTaskOptimistic);
  const createTask = useBoardStore((s) => s.createTask);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draftStatus, setDraftStatus] = useState<TaskStatus | null>(null);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) {
      map[t.status]?.push(t);
    }
    for (const status of COLUMNS) {
      map[status] = [...map[status]].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  const onDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === String(event.active.id));
    setActiveTask(task ?? null);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus = task.status;
    const overId = String(over.id);

    if (COLUMNS.includes(overId as TaskStatus)) {
      nextStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) nextStatus = overTask.status;
    }

    const columnTasks = tasks
      .filter((t) => t.status === nextStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    let position = columnTasks.length;
    if (!COLUMNS.includes(overId as TaskStatus)) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex >= 0) position = overIndex;
    }

    if (task.status === nextStatus && task.position === position) return;

    try {
      await moveTaskOptimistic(taskId, nextStatus, position);
    } catch {
      // toast handled in store
    }
  };

  const submitCreate = async () => {
    if (!draftStatus || !title.trim()) return;
    setCreating(true);
    try {
      const task = await createTask(title.trim(), draftStatus);
      setTitle('');
      setDraftStatus(null);
      if (task) selectTask(task.id);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((c) => (
          <Skeleton key={c} className="h-[420px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{board?.name ?? 'Board'}</h1>
        <p className="text-sm text-slate-500">Drag tasks between columns to update status.</p>
      </div>

      {draftStatus ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="min-w-[240px] flex-1">
            <Input
              label={`New task in ${draftStatus.replace('_', ' ')}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitCreate();
              }}
              autoFocus
            />
          </div>
          <Button loading={creating} onClick={() => void submitCreate()}>
            Add
          </Button>
          <Button variant="secondary" onClick={() => setDraftStatus(null)}>
            Cancel
          </Button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        <div className="grid gap-4 lg:grid-cols-3" data-testid="kanban-board">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={byStatus[status]}
              onOpenTask={selectTask}
              onAdd={setDraftStatus}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onOpen={() => undefined} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
