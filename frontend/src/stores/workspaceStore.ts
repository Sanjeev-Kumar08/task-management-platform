import { create } from 'zustand';
import type { Project, Workspace, WorkspaceAnalytics, AuditLog } from '@/types';
import { normalizeId, normalizeList } from '@/utils/normalize';
import { STORAGE_KEYS, writeJson } from '@/utils/storage';
import * as workspaceService from '@/services/workspace.service';
import * as projectService from '@/services/project.service';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  analytics: WorkspaceAnalytics | null;
  activity: AuditLog[];
  loading: boolean;
  analyticsLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchAnalytics: (workspaceId: string) => Promise<void>;
  fetchActivity: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<Project>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  projects: [],
  analytics: null,
  activity: [],
  loading: false,
  analyticsLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await workspaceService.listWorkspaces();
      const workspaces = normalizeList(raw as Array<Workspace & { _id?: string }>).map((w) => ({
        ...w,
        ownerId: String(w.ownerId),
        members: (w.members ?? []).map((m) => ({
          ...m,
          userId: String(m.userId),
        })),
      }));
      set({ workspaces, loading: false });
      if (!get().currentWorkspace && workspaces.length > 0) {
        await get().selectWorkspace(workspaces[0].id);
      }
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load workspaces',
      });
    }
  },

  selectWorkspace: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const raw = await workspaceService.getWorkspace(workspaceId);
      const workspace = {
        ...normalizeId(raw as Workspace & { _id?: string }),
        ownerId: String((raw as Workspace).ownerId),
        members: ((raw as Workspace).members ?? []).map((m) => ({
          ...m,
          userId: String(m.userId),
        })),
      };
      writeJson(STORAGE_KEYS.lastWorkspace, workspace.id);
      set({ currentWorkspace: workspace, loading: false });
      await Promise.all([
        get().fetchProjects(workspaceId),
        get().fetchAnalytics(workspaceId),
        get().fetchActivity(workspaceId),
      ]);
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load workspace',
      });
    }
  },

  fetchProjects: async (workspaceId) => {
    const raw = await projectService.listProjects(workspaceId);
    set({ projects: normalizeList(raw as Array<Project & { _id?: string }>) });
  },

  fetchAnalytics: async (workspaceId) => {
    set({ analyticsLoading: true });
    try {
      const analytics = await workspaceService.getAnalytics(workspaceId);
      set({ analytics, analyticsLoading: false });
    } catch {
      set({ analyticsLoading: false });
    }
  },

  fetchActivity: async (workspaceId) => {
    try {
      const raw = await workspaceService.getActivity(workspaceId);
      set({ activity: normalizeList(raw as Array<AuditLog & { _id?: string }>) });
    } catch {
      set({ activity: [] });
    }
  },

  createProject: async (workspaceId, name, description) => {
    const raw = await projectService.createProject(workspaceId, { name, description });
    const project = normalizeId(raw as Project & { _id?: string });
    set({ projects: [project, ...get().projects] });
    return project;
  },
}));
