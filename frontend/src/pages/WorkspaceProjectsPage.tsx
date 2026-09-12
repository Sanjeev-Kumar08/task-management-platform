import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectList } from '@/features/projects/ProjectList';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { LoadingPage } from '@/components/common/LoadingPage';

export function WorkspaceProjectsPage() {
  const { workspaceId } = useParams();
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const loading = useWorkspaceStore((s) => s.loading);

  useEffect(() => {
    if (workspaceId) void selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  if (!workspaceId) return null;
  if (loading && !current) return <LoadingPage />;

  return <ProjectList workspaceId={workspaceId} />;
}
