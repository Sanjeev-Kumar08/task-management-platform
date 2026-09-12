import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from '@/features/boards/KanbanBoard';
import { useBoardStore } from '@/stores/boardStore';
import type { Board, Task } from '@/types';

vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const board: Board = {
  id: 'board1',
  projectId: 'project1',
  name: 'Launch Board',
  columns: [
    { id: 'TODO', name: 'TODO', position: 0 },
    { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
    { id: 'DONE', name: 'DONE', position: 2 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const tasks: Task[] = [
  {
    id: 't1',
    boardId: 'board1',
    projectId: 'project1',
    title: 'Draft launch checklist',
    description: 'Coordinate go-live',
    status: 'TODO',
    priority: 'HIGH',
    position: 0,
    assigneeId: null,
    dueDate: null,
    attachments: [],
    createdBy: 'u1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    boardId: 'board1',
    projectId: 'project1',
    title: 'Design landing page',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    position: 0,
    assigneeId: null,
    dueDate: null,
    attachments: [],
    createdBy: 'u1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('board rendering', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board,
      tasks,
      loading: false,
      selectedTaskId: null,
      error: null,
      pendingMutations: new Set(),
    });
  });

  it('renders columns and task titles', () => {
    render(<KanbanBoard />);
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.getByTestId('column-TODO')).toBeInTheDocument();
    expect(screen.getByTestId('column-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('column-DONE')).toBeInTheDocument();
    expect(screen.getByText('Draft launch checklist')).toBeInTheDocument();
    expect(screen.getByText('Design landing page')).toBeInTheDocument();
    expect(screen.getByText('Launch Board')).toBeInTheDocument();
  });
});
