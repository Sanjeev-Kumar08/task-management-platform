import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { CreateWorkspaceDialog } from '@/features/workspace/CreateWorkspaceDialog';
import { useUiStore } from '@/stores/uiStore';
import { Select } from '@/components/ui/Select';

export function WorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const onSwitch = async (workspaceId: string) => {
    if (!workspaceId || workspaceId === current?.id) return;
    try {
      await selectWorkspace(workspaceId);
      const match = location.pathname.match(/^\/workspaces\/[^/]+(\/.*)?$/);
      const suffix = match?.[1] ?? '';
      navigate(`/workspaces/${workspaceId}${suffix}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Unable to switch workspace', 'error');
    }
  };

  const options = workspaces.length
    ? workspaces.map((w) => ({ value: w.id, label: w.name }))
    : [{ value: '', label: 'No workspaces', disabled: true }];

  return (
    <>
      <div className="flex h-9 min-w-0 items-center gap-1 sm:gap-1.5">
        <Select
          size="sm"
          className="min-w-0 flex-1"
          value={current?.id ?? ''}
          onChange={(e) => void onSwitch(e.target.value)}
          options={options}
          aria-label="Switch workspace"
          title={current?.name}
          placeholder="Workspace"
        />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Create workspace"
          title="Create workspace"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
