import { NavLink, useParams } from 'react-router-dom';
import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/utils/cn';
import { fadeIn, transition } from '@/lib/motion';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
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
    {
      to: workspaceId ? `/workspaces/${workspaceId}/settings` : '/dashboard',
      label: 'Settings',
      icon: Settings,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: UserRound,
    },
  ];

  const nav = (opts: { showLabels: boolean; onNavigate?: () => void }) => (
    <>
      <div className="flex h-14 items-center justify-between px-3">
        {opts.showLabels ? (
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white shadow-sm">
              W
            </div>
            <span className="font-display text-base font-semibold tracking-tight">WorkSpace</span>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white shadow-sm">
            W
          </div>
        )}
        {mobileOpen ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800',
              collapsed && 'hidden',
            )}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {!mobileOpen && collapsed ? (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mx-auto mb-2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      ) : null}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            onClick={opts.onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white',
                isActive && 'text-brand-900 dark:text-brand-100',
                !opts.showLabels && 'justify-center px-2',
              )
            }
            title={item.label}
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId={mobileOpen ? 'nav-active-mobile' : 'nav-active'}
                    className="absolute inset-0 rounded-xl bg-brand-100 ring-1 ring-brand-300 dark:bg-brand-900/70 dark:ring-brand-600"
                    transition={transition}
                  />
                ) : null}
                <item.icon
                  className={cn(
                    'relative z-10 h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-brand-800 dark:text-brand-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200',
                  )}
                />
                {opts.showLabels ? (
                  <span className="relative z-10">{item.label}</span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <motion.aside
        className={cn(
          'hidden h-full flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-xl md:flex dark:border-slate-800/80 dark:bg-slate-950/55',
        )}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={transition}
      >
        {nav({ showLabels: !collapsed })}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              type="button"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={onMobileClose}
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
            />
            <motion.aside
              className="relative flex h-full w-72 flex-col border-r border-slate-200/80 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-950"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={transition}
            >
              {nav({ showLabels: true, onNavigate: onMobileClose })}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
