import { Link } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { GlobalSearch } from '@/features/search/GlobalSearch';
import { NotificationDropdown } from '@/features/notifications/NotificationDropdown';
import { WorkspaceSwitcher } from '@/features/workspace/WorkspaceSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200/70 bg-white/65 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/45">
      <button
        type="button"
        className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden min-w-0 flex-1 md:block">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <WorkspaceSwitcher />
        {workspace ? (
          <Link
            to={`/workspaces/${workspace.id}/settings`}
            className="hidden rounded-xl px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 sm:inline dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Settings
          </Link>
        ) : null}
        <NotificationDropdown />
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
        {user ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 py-1 pl-1 pr-1.5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-medium leading-none">{user.name}</p>
              <p className="mt-0.5 max-w-[140px] truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
