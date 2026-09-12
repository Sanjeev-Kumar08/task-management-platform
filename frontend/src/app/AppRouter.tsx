import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { GuestRoute, ProtectedRoute } from '@/app/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkspaceProjectsPage } from '@/pages/WorkspaceProjectsPage';
import { WorkspaceTasksPage } from '@/pages/WorkspaceTasksPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { BoardPage } from '@/pages/BoardPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId/projects" element={<WorkspaceProjectsPage />} />
            <Route path="/workspaces/:workspaceId/tasks" element={<WorkspaceTasksPage />} />
            <Route path="/workspaces/:workspaceId/messages" element={<MessagesPage />} />
            <Route path="/projects/:projectId" element={<ProjectPage />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
