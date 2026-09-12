import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import * as workspaceService from '@/services/workspace.service';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';
import { useNavigate } from 'react-router-dom';

export function SettingsGeneralPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const refresh = useWorkspaceStore((s) => s.refreshCurrentWorkspace);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const clearCurrent = useWorkspaceStore((s) => s.clearCurrentWorkspace);
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const role = myWorkspaceRole(workspace, user?.id);
  const canEdit = canManageMembers(role);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? '');
    setDescription(workspace?.description ?? '');
  }, [workspace?.id, workspace?.name, workspace?.description]);

  if (!workspace) {
    return <p className="text-sm text-slate-500">Select a workspace to edit settings.</p>;
  }

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await workspaceService.updateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim(),
      });
      await refresh();
      pushToast('Workspace updated', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (role !== 'OWNER') return;
    const ok = await confirmDialog({
      title: 'Delete workspace',
      description: 'Delete this workspace permanently? This cannot be undone.',
      confirmLabel: 'Delete workspace',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      clearCurrent();
      await fetchWorkspaces();
      pushToast('Workspace deleted', 'success');
      navigate('/dashboard');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">General</h2>
        <p className="text-sm text-slate-500">Workspace name and description.</p>
      </div>
      <div className="space-y-4">
          <Input
            label="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            placeholder="e.g. Trex"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="What is this workspace for?"
          />
          <p className="text-xs text-slate-500">
            URL slug: <span className="font-medium text-slate-600 dark:text-slate-300">{workspace.slug}</span>
          </p>
        {canEdit ? (
          <Button onClick={() => void save()} loading={saving}>
            Save changes
          </Button>
        ) : (
          <p className="text-sm text-slate-500">Only owners and admins can edit workspace details.</p>
        )}
      </div>
      {role === 'OWNER' ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Danger zone</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Deleting a workspace removes projects, boards, and messages for everyone.
          </p>
          <Button
            className="mt-3"
            variant="danger"
            loading={deleting}
            onClick={() => void remove()}
          >
            Delete workspace
          </Button>
        </div>
      ) : null}
    </div>
  );
}
