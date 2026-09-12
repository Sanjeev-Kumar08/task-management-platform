import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingPage } from '@/components/common/LoadingPage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as projectService from '@/services/project.service';
import * as boardService from '@/services/board.service';
import type { Board, Project } from '@/types';
import { normalizeId, normalizeList } from '@/utils/normalize';
import { LayoutGrid, Plus } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([projectService.getProject(projectId), boardService.listBoards(projectId)])
      .then(([p, b]) => {
        if (cancelled) return;
        setProject(normalizeId(p as Project & { _id?: string }));
        setBoards(normalizeList(b as Array<Board & { _id?: string }>));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const createBoard = async () => {
    if (!projectId || !name.trim()) return;
    setCreating(true);
    try {
      const board = normalizeId(
        (await boardService.createBoard(projectId, { name: name.trim() })) as Board & {
          _id?: string;
        },
      );
      setBoards((prev) => [...prev, board]);
      setName('');
      pushToast('Board created', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to create board', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!project) return <p className="text-sm text-red-600">Project not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Project</p>
        <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{project.description || 'No description'}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-[220px] flex-1">
          <Input
            label="New board"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Board name"
          />
        </div>
        <Button loading={creating} onClick={() => void createBoard()}>
          <Plus className="h-4 w-4" />
          Create board
        </Button>
      </div>

      {!boards.length ? (
        <EmptyState
          icon={LayoutGrid}
          title="No boards"
          description="Create a board to start managing tasks."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Link
              key={b.id}
              to={`/boards/${b.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <h3 className="font-display font-semibold">{b.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{b.columns?.length ?? 3} columns</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
