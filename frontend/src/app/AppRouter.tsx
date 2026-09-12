import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { GuestRoute, ProtectedRoute } from '@/app/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { InviteAcceptPage } from '@/pages/InviteAcceptPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { WorkspaceProjectsPage } from '@/pages/WorkspaceProjectsPage';
import { WorkspaceTasksPage } from '@/pages/WorkspaceTasksPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { BoardPage } from '@/pages/BoardPage';
import { SettingsLayout } from '@/pages/settings/SettingsLayout';
import { SettingsGeneralPage } from '@/pages/settings/SettingsGeneralPage';
import { SettingsMembersPage } from '@/pages/settings/SettingsMembersPage';
import { SettingsInvitationsPage } from '@/pages/settings/SettingsInvitationsPage';
import { SettingsBillingPage } from '@/pages/settings/SettingsBillingPage';
import { SettingsAccountPage } from '@/pages/settings/SettingsAccountPage';
import { SettingsSecurityPage } from '@/pages/settings/SettingsSecurityPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId/projects" element={<WorkspaceProjectsPage />} />
            <Route path="/workspaces/:workspaceId/tasks" element={<WorkspaceTasksPage />} />
            <Route path="/workspaces/:workspaceId/messages" element={<MessagesPage />} />
            <Route path="/workspaces/:workspaceId/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="general" element={<SettingsGeneralPage />} />
              <Route path="members" element={<SettingsMembersPage />} />
              <Route path="invitations" element={<SettingsInvitationsPage />} />
              <Route path="billing" element={<SettingsBillingPage />} />
              <Route path="account" element={<SettingsAccountPage />} />
              <Route path="security" element={<SettingsSecurityPage />} />
            </Route>
            <Route path="/projects/:projectId" element={<ProjectPage />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
