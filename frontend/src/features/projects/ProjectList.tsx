import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import { formatRelativeTime } from '@/utils/format';
import { FolderKanban } from 'lucide-react';
import * as projectService from '@/services/project.service';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';

export function ProjectList({ workspaceId }: { workspaceId: string }) {
  const projects = useWorkspaceStore((s) => s.projects);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const fetchProjects = useWorkspaceStore((s) => s.fetchProjects);
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const role = myWorkspaceRole(currentWorkspace, user?.id);
  const isAdmin = canManageMembers(role);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!showArchived && p.archived) return false;
      if (showArchived && !p.archived) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
    });
  }, [projects, query, showArchived]);

  const canDelete = (createdBy: string) => isAdmin || String(createdBy) === user?.id;

  const onCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createProject(workspaceId, name.trim(), description.trim());
      setName('');
      setDescription('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (projectId: string, archived: boolean) => {
    try {
      await projectService.updateProject(projectId, { archived: !archived });
      await fetchProjects(workspaceId, { archived: showArchived ? true : false });
      pushToast(archived ? 'Project restored' : 'Project archived', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const onDelete = async (projectId: string, projectName: string) => {
    const ok = await confirmDialog({
      title: 'Delete project',
      description: `Delete “${projectName}”? This removes its boards and tasks.`,
      confirmLabel: 'Delete project',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(projectId);
    try {
      await projectService.deleteProject(projectId);
      await fetchProjects(workspaceId, { archived: showArchived ? true : false });
      pushToast('Project deleted', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
            Workspace
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Organize work across boards and tasks.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant={showArchived ? 'primary' : 'secondary'}
          onClick={() => {
            const next = !showArchived;
            setShowArchived(next);
            void fetchProjects(workspaceId, { archived: next ? true : false });
          }}
        >
          {showArchived ? 'Showing archived' : 'Show archived'}
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3 app-panel p-4 md:p-5"
          >
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button loading={saving} onClick={() => void onCreate()}>
                Create
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!visible.length ? (
        <EmptyState
          icon={FolderKanban}
          title={showArchived ? 'No archived projects' : 'No projects'}
          description={
            showArchived
              ? 'Archived projects will appear here.'
              : 'Create your first project to get started.'
          }
        />
      ) : (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {visible.map((p) => (
            <motion.div
              key={p.id}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="app-panel flex flex-col p-4 md:p-5"
            >
              <Link to={`/projects/${p.id}`} className="block min-w-0 flex-1">
                <h3 className="font-display font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                  {p.description || 'No description'}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="text-xs text-slate-400">Updated {formatRelativeTime(p.updatedAt)}</p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void toggleArchive(p.id, Boolean(p.archived))}
                  >
                    {p.archived ? 'Restore' : 'Archive'}
                  </Button>
                  {canDelete(p.createdBy) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={deletingId === p.id}
                      onClick={() => void onDelete(p.id, p.name)}
                      aria-label={`Delete ${p.name}`}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
