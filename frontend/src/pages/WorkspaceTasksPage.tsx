import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import * as boardService from '@/services/board.service';
import * as taskService from '@/services/task.service';
import type { Task } from '@/types';
import { normalizeList } from '@/utils/normalize';
import { PriorityBadge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/common/LoadingPage';
import { EmptyState } from '@/components/common/EmptyState';
import { CheckSquare } from 'lucide-react';
import { formatDate } from '@/utils/format';

export function WorkspaceTasksPage() {
  const { workspaceId } = useParams();
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const projects = useWorkspaceStore((s) => s.projects);
  const [tasks, setTasks] = useState<Array<Task & { boardId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | Task['status']>('ALL');

  useEffect(() => {
    if (workspaceId) void selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  useEffect(() => {
    if (!projects.length) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const all: Array<Task & { boardId: string }> = [];
      for (const project of projects) {
        const boards = normalizeList(
          (await boardService.listBoards(project.id)) as Array<{ _id?: string; id?: string }>,
        );
        for (const board of boards) {
          const boardTasks = normalizeList(
            (await taskService.listTasks(board.id)) as Array<Task & { _id?: string }>,
          );
          all.push(...boardTasks.map((t) => ({ ...t, boardId: board.id })));
        }
      }
      if (!cancelled) {
        setTasks(all);
        setLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projects]);

  const filtered = useMemo(
    () => (filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  if (loading) return <LoadingPage label="Loading tasks…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-slate-500">All tasks across workspace projects.</p>
        </div>
        <select
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="ALL">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {!filtered.length ? (
        <EmptyState icon={CheckSquare} title="No tasks" description="Tasks will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-50 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/boards/${t.boardId}`}
                      className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
