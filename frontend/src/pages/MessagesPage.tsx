import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessagesPanel } from '@/features/messages/MessagesPanel';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { LoadingPage } from '@/components/common/LoadingPage';

export function MessagesPage() {
  const { workspaceId } = useParams();
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const loading = useWorkspaceStore((s) => s.loading);

  useEffect(() => {
    if (workspaceId) void selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  if (!workspaceId) return null;
  if (loading && !current) return <LoadingPage />;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700/80 dark:text-brand-300/80">
          Workspace
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Workspace channels and real-time chat.</p>
      </div>
      <MessagesPanel workspaceId={workspaceId} />
    </div>
  );
}
