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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-slate-500">Workspace channels and real-time chat.</p>
      </div>
      <MessagesPanel workspaceId={workspaceId} />
    </div>
  );
}
