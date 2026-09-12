import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardStore } from '@/stores/boardStore';
import type { Board, Task } from '@/types';
import * as taskService from '@/services/task.service';

vi.mock('@/services/task.service', () => ({
  moveTask: vi.fn(),
  listTasks: vi.fn(),
  createTask: vi.fn(),
}));

const board: Board = {
  id: 'board1',
  projectId: 'project1',
  name: 'Board',
  columns: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const task: Task = {
  id: 'task1',
  boardId: 'board1',
  projectId: 'project1',
  title: 'Move me',
  description: '',
  status: 'TODO',
  priority: 'LOW',
  position: 0,
  assigneeId: null,
  dueDate: null,
  attachments: [],
  createdBy: 'u1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('optimistic move rollback', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board,
      tasks: [task],
      pendingMutations: new Set(),
      moving: false,
      loading: false,
      error: null,
    });
    vi.mocked(taskService.moveTask).mockReset();
  });

  it('rolls back task position when move API fails', async () => {
    vi.mocked(taskService.moveTask).mockRejectedValueOnce(new Error('Server unavailable'));

    await expect(useBoardStore.getState().moveTaskOptimistic('task1', 'DONE', 0)).rejects.toThrow(
      'Server unavailable',
    );

    const state = useBoardStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].status).toBe('TODO');
    expect(state.tasks[0].position).toBe(0);
    expect(state.pendingMutations.size).toBe(0);
    expect(state.moving).toBe(false);
  });

  it('applies server task on successful move', async () => {
    vi.mocked(taskService.moveTask).mockResolvedValueOnce({
      ...task,
      _id: task.id,
      status: 'DONE',
      position: 0,
    } as never);

    await useBoardStore.getState().moveTaskOptimistic('task1', 'DONE', 0);

    const state = useBoardStore.getState();
    expect(state.tasks[0].status).toBe('DONE');
    expect(state.pendingMutations.size).toBe(0);
  });
});
