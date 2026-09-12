import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/common/EmptyState';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatRelativeTime } from '@/utils/format';
import { FolderKanban } from 'lucide-react';

export function ProjectList({ workspaceId }: { workspaceId: string }) {
  const projects = useWorkspaceStore((s) => s.projects);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-500">Organize work across boards and tasks.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {open ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
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
        </div>
      ) : null}

      {!projects.length ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects"
          description="Create your first project to get started."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <h3 className="font-display font-semibold">{p.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {p.description || 'No description'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Updated {formatRelativeTime(p.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
