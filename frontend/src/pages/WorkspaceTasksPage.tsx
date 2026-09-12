import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import * as workspaceService from '@/services/workspace.service';
import type { Task } from '@/types';
import { normalizeList } from '@/utils/normalize';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { LoadingPage } from '@/components/common/LoadingPage';
import { EmptyState } from '@/components/common/EmptyState';
import { CheckSquare } from 'lucide-react';
import { formatDate } from '@/utils/format';
import { staggerContainer, staggerItem } from '@/lib/motion';

const filterClass =
  'h-10 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 sm:w-auto dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

const STATUSES: Array<'ALL' | Task['status']> = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES: Array<'ALL' | Task['priority']> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function parseStatus(value: string | null): 'ALL' | Task['status'] {
  if (value && STATUSES.includes(value as (typeof STATUSES)[number])) {
    return value as 'ALL' | Task['status'];
  }
  return 'ALL';
}

export function WorkspaceTasksPage() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const currentId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [tasks, setTasks] = useState<Array<Task & { boardId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | Task['status']>(() =>
    parseStatus(searchParams.get('status')),
  );
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Task['priority']>('ALL');
  const [labelFilter, setLabelFilter] = useState('');

  useEffect(() => {
    setFilter(parseStatus(searchParams.get('status')));
  }, [searchParams]);

  useEffect(() => {
    if (workspaceId && workspaceId !== currentId) {
      void selectWorkspace(workspaceId).catch(() => undefined);
    }
  }, [workspaceId, currentId, selectWorkspace]);

  useEffect(() => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void workspaceService
      .listWorkspaceTasks(workspaceId)
      .then((raw) => {
        if (cancelled) return;
        const list = normalizeList(raw as Array<Task & { _id?: string; boardId?: string }>);
        setTasks(
          list.map((t) => ({
            ...t,
            boardId: String(t.boardId),
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const filtered = useMemo(() => {
    const label = labelFilter.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter !== 'ALL' && t.status !== filter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (label && !(t.labels ?? []).some((l) => l.toLowerCase().includes(label))) return false;
      return true;
    });
  }, [tasks, filter, priorityFilter, labelFilter]);

  const onStatusChange = (value: string) => {
    const next = parseStatus(value);
    setFilter(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'ALL') params.delete('status');
    else params.set('status', next);
    setSearchParams(params, { replace: true });
  };

  if (loading) return <LoadingPage label="Loading tasks…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
            Workspace
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">All tasks across workspace projects.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Select
            className="min-w-0 sm:min-w-[148px]"
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              { value: 'ALL', label: 'All statuses' },
              { value: 'TODO', label: 'To do' },
              { value: 'IN_PROGRESS', label: 'In progress' },
              { value: 'DONE', label: 'Done' },
            ]}
          />
          <Select
            className="min-w-0 sm:min-w-[148px]"
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                PRIORITIES.includes(e.target.value as (typeof PRIORITIES)[number])
                  ? (e.target.value as typeof priorityFilter)
                  : 'ALL',
              )
            }
            options={[
              { value: 'ALL', label: 'All priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
          <input
            className={filterClass}
            placeholder="Filter by label"
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
          />
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState icon={CheckSquare} title="No tasks" description="Tasks will appear here." />
      ) : (
        <div className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Title</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium">Priority</th>
                  <th className="px-4 py-3.5 font-medium">Due</th>
                </tr>
              </thead>
              <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
                {filtered.map((t) => (
                  <motion.tr
                    key={t.id}
                    variants={staggerItem}
                    className="border-b border-slate-50 transition hover:bg-slate-50/70 last:border-0 dark:border-slate-800/80 dark:hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/boards/${t.boardId}`}
                        className="font-medium text-brand-700 transition hover:text-brand-800 dark:text-brand-300"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(t.dueDate)}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
