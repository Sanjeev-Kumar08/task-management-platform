import { create } from 'zustand';
import type { Board, Task, TaskStatus } from '@/types';
import { createId } from '@/utils/id';
import { normalizeId, normalizeList } from '@/utils/normalize';
import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';
import * as boardService from '@/services/board.service';
import * as taskService from '@/services/task.service';

interface ToastFn {
  (message: string, type?: 'error' | 'success' | 'info'): void;
}

let toastFn: ToastFn | null = null;

export function setBoardToast(fn: ToastFn | null): void {
  toastFn = fn;
}

interface BoardState {
  board: Board | null;
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  moving: boolean;
  pendingMutations: Set<string>;
  offline: boolean;
  error: string | null;
  loadBoard: (boardId: string) => Promise<void>;
  selectTask: (taskId: string | null) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  applyRemoteMove: (task: Task, mutationId?: string) => void;
  moveTaskOptimistic: (taskId: string, status: TaskStatus, position: number) => Promise<void>;
  createTask: (title: string, status?: TaskStatus) => Promise<Task | null>;
  updateTaskLocal: (taskId: string, patch: Partial<Task>) => void;
  setOffline: (offline: boolean) => void;
  cacheTasks: () => void;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.position - b.position;
  });
}

function reindexColumn(tasks: Task[], status: TaskStatus): Task[] {
  const column = tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.position - b.position)
    .map((t, index) => ({ ...t, position: index }));
  const others = tasks.filter((t) => t.status !== status);
  return sortTasks([...others, ...column]);
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  tasks: [],
  selectedTaskId: null,
  loading: false,
  moving: false,
  pendingMutations: new Set(),
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  error: null,

  setOffline: (offline) => set({ offline }),

  cacheTasks: () => {
    const { board, tasks } = get();
    if (!board) return;
    writeJson(STORAGE_KEYS.boardCache(board.id), { board, tasks, cachedAt: Date.now() });
  },

  loadBoard: async (boardId) => {
    set({ loading: true, error: null, selectedTaskId: null });
    const cached = readJson<{ board: Board; tasks: Task[] } | null>(
      STORAGE_KEYS.boardCache(boardId),
      null,
    );
    if (cached && get().offline) {
      set({ board: cached.board, tasks: cached.tasks, loading: false });
      return;
    }

    try {
      const [boardRaw, tasksRaw] = await Promise.all([
        boardService.getBoard(boardId),
        taskService.listTasks(boardId),
      ]);
      const board = normalizeId(boardRaw as Board & { _id?: string });
      const tasks = sortTasks(
        normalizeList(tasksRaw as Array<Task & { _id?: string }>).map((t) => ({
          ...t,
          attachments: (t.attachments ?? []).map((a) =>
            normalizeId(a as typeof a & { _id?: string }),
          ),
        })),
      );
      set({ board, tasks, loading: false });
      get().cacheTasks();
    } catch (err) {
      if (cached) {
        set({
          board: cached.board,
          tasks: cached.tasks,
          loading: false,
          error: 'Showing cached board (offline or request failed)',
        });
        return;
      }
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load board',
      });
    }
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  upsertTask: (task) => {
    const normalized = normalizeId(task as Task & { _id?: string });
    set((state) => {
      const exists = state.tasks.some((t) => t.id === normalized.id);
      const tasks = exists
        ? state.tasks.map((t) => (t.id === normalized.id ? { ...t, ...normalized } : t))
        : [...state.tasks, normalized];
      return { tasks: sortTasks(tasks) };
    });
    get().cacheTasks();
  },

  removeTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    get().cacheTasks();
  },

  applyRemoteMove: (task, mutationId) => {
    if (mutationId && get().pendingMutations.has(mutationId)) {
      return;
    }
    get().upsertTask(task);
  },

  updateTaskLocal: (taskId, patch) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    }));
    get().cacheTasks();
  },

  createTask: async (title, status = 'TODO') => {
    const board = get().board;
    if (!board) return null;
    const created = await taskService.createTask(board.id, { title, status });
    const task = normalizeId(created as Task & { _id?: string });
    get().upsertTask(task);
    return task;
  },

  moveTaskOptimistic: async (taskId, status, position) => {
    const previous = get().tasks;
    const task = previous.find((t) => t.id === taskId);
    if (!task) return;

    const mutationId = createId();
    const pending = new Set(get().pendingMutations);
    pending.add(mutationId);

    const without = previous.filter((t) => t.id !== taskId);
    const moved: Task = { ...task, status, position };
    const next = reindexColumn([...without, moved], status);

    set({ tasks: next, pendingMutations: pending, moving: true });
    get().cacheTasks();

    try {
      const updated = await taskService.moveTask(taskId, { status, position, mutationId });
      const normalized = normalizeId(updated as Task & { _id?: string });
      const remaining = new Set(get().pendingMutations);
      remaining.delete(mutationId);
      set((state) => ({
        tasks: sortTasks(
          state.tasks.map((t) => (t.id === normalized.id ? { ...t, ...normalized } : t)),
        ),
        pendingMutations: remaining,
        moving: false,
      }));
      get().cacheTasks();
    } catch (err) {
      const remaining = new Set(get().pendingMutations);
      remaining.delete(mutationId);
      set({ tasks: previous, pendingMutations: remaining, moving: false });
      get().cacheTasks();
      toastFn?.(err instanceof Error ? err.message : 'Failed to move task', 'error');
      throw err;
    }
  },
}));
