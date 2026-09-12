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
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[22rem] flex-col gap-3 sm:h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-9.5rem)]">
      <div className="shrink-0">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 dark:text-brand-200">
          Workspace
        </p>
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
          Messages
        </h1>
        <p className="mt-1 hidden text-sm text-slate-500 sm:block">
          Workspace channels and real-time chat.
        </p>
      </div>
      <MessagesPanel workspaceId={workspaceId} />
    </div>
  );
}
