import { NavLink, useParams } from 'react-router-dom';
import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/utils/cn';

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { workspaceId: paramId } = useParams();
  const workspaceId = paramId ?? workspace?.id;

  const items = [
    {
      to: workspaceId ? `/workspaces/${workspaceId}` : '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: workspaceId ? `/workspaces/${workspaceId}/projects` : '/dashboard',
      label: 'Projects',
      icon: FolderKanban,
    },
    {
      to: workspaceId ? `/workspaces/${workspaceId}/tasks` : '/dashboard',
      label: 'Tasks',
      icon: CheckSquare,
    },
    {
      to: workspaceId ? `/workspaces/${workspaceId}/messages` : '/dashboard',
      label: 'Messages',
      icon: MessageSquare,
    },
  ];

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center justify-between px-3">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-display text-sm font-bold text-white">
              W
            </div>
            <span className="font-display text-base font-semibold tracking-tight">WorkSpace</span>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-display text-sm font-bold text-white">
            W
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
            collapsed && 'hidden',
          )}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      {collapsed ? (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mx-auto mb-2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                isActive && 'bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-200',
                collapsed && 'justify-center px-2',
              )
            }
            title={item.label}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
