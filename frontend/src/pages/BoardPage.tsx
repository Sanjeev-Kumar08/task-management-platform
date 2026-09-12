import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { KanbanBoard } from '@/features/boards/KanbanBoard';
import { TaskDrawer } from '@/features/tasks/TaskDrawer';
import { useBoardStore, setBoardToast } from '@/stores/boardStore';
import { useUiStore } from '@/stores/uiStore';
import { useBoardSocket } from '@/hooks/useSocket';

export function BoardPage() {
  const { boardId } = useParams();
  const loadBoard = useBoardStore((s) => s.loadBoard);
  const error = useBoardStore((s) => s.error);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    setBoardToast(pushToast);
    return () => setBoardToast(null);
  }, [pushToast]);

  useEffect(() => {
    if (boardId) void loadBoard(boardId);
  }, [boardId, loadBoard]);

  useBoardSocket(boardId);

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {error}
        </p>
      ) : null}
      <KanbanBoard />
      <TaskDrawer />
    </div>
  );
}
