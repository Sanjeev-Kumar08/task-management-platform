import { useWorkspaceStore } from '@/stores/workspaceStore';

export function WorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);

  if (!workspaces.length) return null;

  return (
    <select
      className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      value={current?.id ?? ''}
      onChange={(e) => void selectWorkspace(e.target.value)}
      aria-label="Switch workspace"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
