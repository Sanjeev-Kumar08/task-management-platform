import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LoadingPage } from '@/components/common/LoadingPage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import * as projectService from '@/services/project.service';
import * as boardService from '@/services/board.service';
import type { Board, Project } from '@/types';
import { normalizeId, normalizeList } from '@/utils/normalize';
import { LayoutGrid, Plus } from 'lucide-react';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';

export function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pushToast = useUiStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const fetchProjects = useWorkspaceStore((s) => s.fetchProjects);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([projectService.getProject(projectId), boardService.listBoards(projectId)])
      .then(([p, b]) => {
        if (cancelled) return;
        const normalized = normalizeId(p as Project & { _id?: string });
        setProject(normalized);
        setProjectName(normalized.name);
        setProjectDescription(normalized.description ?? '');
        setBoards(normalizeList(b as Array<Board & { _id?: string }>));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const role = myWorkspaceRole(currentWorkspace, user?.id);
  const canDelete =
    Boolean(project) &&
    (canManageMembers(role) || String(project!.createdBy) === user?.id);

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

  const saveProject = async () => {
    if (!projectId) return;
    setSavingProject(true);
    try {
      const updated = normalizeId(
        (await projectService.updateProject(projectId, {
          name: projectName.trim(),
          description: projectDescription.trim(),
        })) as Project & { _id?: string },
      );
      setProject(updated);
      setEditing(false);
      pushToast('Project updated', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to update project', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const deleteProject = async () => {
    if (!project || !projectId) return;
    const ok = await confirmDialog({
      title: 'Delete project',
      description: `Delete “${project.name}”? This removes its boards and tasks.`,
      confirmLabel: 'Delete project',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(projectId);
      if (project.workspaceId) {
        await fetchProjects(project.workspaceId).catch(() => undefined);
        navigate(`/workspaces/${project.workspaceId}/projects`);
      } else {
        navigate('/dashboard');
      }
      pushToast('Project deleted', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!project) return <p className="text-sm text-red-600">Project not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
            Project
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{project.description || 'No description'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel' : 'Edit project'}
          </Button>
          {canDelete ? (
            <Button variant="danger" loading={deleting} onClick={() => void deleteProject()}>
              Delete project
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {editing ? (
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3 app-panel p-4 md:p-5"
          >
            <Input
              label="Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <Textarea
              label="Description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <Button loading={savingProject} onClick={() => void saveProject()}>
              Save project
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-end gap-2 app-panel p-3 md:p-4">
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
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {boards.map((b) => (
            <motion.div key={b.id} variants={staggerItem} whileHover={{ y: -2 }}>
              <Link
                to={`/boards/${b.id}`}
                className="app-panel block p-4 transition hover:border-brand-300 dark:hover:border-brand-700 md:p-5"
              >
                <h3 className="font-display font-semibold tracking-tight">{b.name}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{b.columns?.length ?? 3} columns</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
