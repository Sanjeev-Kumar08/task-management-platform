import { create } from 'zustand';
import type { Project, Workspace, WorkspaceAnalytics, AuditLog } from '@/types';
import { normalizeId, normalizeList } from '@/utils/normalize';
import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';
import * as workspaceService from '@/services/workspace.service';
import * as projectService from '@/services/project.service';

function normalizeWorkspace(raw: Workspace & { _id?: string }): Workspace {
  return {
    ...normalizeId(raw),
    ownerId: String(raw.ownerId),
    description: raw.description ?? '',
    avatar: raw.avatar ?? null,
    members: (raw.members ?? []).map((m) => ({
      ...m,
      userId:
        typeof m.userId === 'string'
          ? String(m.userId)
          : {
              ...m.userId,
              id: String((m.userId as { id?: string; _id?: string }).id ?? (m.userId as { _id?: string })._id),
            },
    })),
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  analytics: WorkspaceAnalytics | null;
  activity: AuditLog[];
  loading: boolean;
  analyticsLoading: boolean;
  error: string | null;
  fetchWorkspaces: (opts?: { preferId?: string }) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (input: {
    name: string;
    slug?: string;
    description?: string;
  }) => Promise<Workspace>;
  refreshCurrentWorkspace: () => Promise<void>;
  fetchProjects: (workspaceId: string, opts?: { q?: string; archived?: boolean }) => Promise<void>;
  fetchAnalytics: (workspaceId: string) => Promise<void>;
  fetchActivity: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<Project>;
  clearCurrentWorkspace: () => void;
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

  clearCurrentWorkspace: () => {
    set({
      currentWorkspace: null,
      projects: [],
      analytics: null,
      activity: [],
    });
  },

  fetchWorkspaces: async (opts) => {
    set({ loading: true, error: null });
    try {
      const raw = await workspaceService.listWorkspaces();
      const workspaces = (raw as Array<Workspace & { _id?: string }>).map(normalizeWorkspace);
      set({ workspaces, loading: false });

      const preferId = opts?.preferId;
      const lastId = readJson<string | null>(STORAGE_KEYS.lastWorkspace, null);
      const currentId = get().currentWorkspace?.id;
      const target =
        (preferId && workspaces.find((w) => w.id === preferId)?.id) ||
        (currentId && workspaces.find((w) => w.id === currentId)?.id) ||
        (lastId && workspaces.find((w) => w.id === lastId)?.id) ||
        workspaces[0]?.id;

      if (target) {
        if (get().currentWorkspace?.id !== target) {
          await get().selectWorkspace(target);
        }
      } else {
        get().clearCurrentWorkspace();
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
      const workspace = normalizeWorkspace(raw as Workspace & { _id?: string });
      writeJson(STORAGE_KEYS.lastWorkspace, workspace.id);
      set({ currentWorkspace: workspace, loading: false });
      set((s) => ({
        workspaces: s.workspaces.some((w) => w.id === workspace.id)
          ? s.workspaces.map((w) => (w.id === workspace.id ? workspace : w))
          : [workspace, ...s.workspaces],
      }));
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
      throw err;
    }
  },

  createWorkspace: async (input) => {
    const raw = await workspaceService.createWorkspace(input);
    const workspace = normalizeWorkspace(raw as Workspace & { _id?: string });
    writeJson(STORAGE_KEYS.lastWorkspace, workspace.id);
    set((s) => ({
      workspaces: [workspace, ...s.workspaces.filter((w) => w.id !== workspace.id)],
      currentWorkspace: workspace,
    }));
    await Promise.all([
      get().fetchProjects(workspace.id),
      get().fetchAnalytics(workspace.id),
      get().fetchActivity(workspace.id),
    ]);
    return workspace;
  },

  refreshCurrentWorkspace: async () => {
    const id = get().currentWorkspace?.id;
    if (!id) return;
    await get().selectWorkspace(id);
  },

  fetchProjects: async (workspaceId, opts) => {
    const raw = await projectService.listProjects(workspaceId, opts);
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
