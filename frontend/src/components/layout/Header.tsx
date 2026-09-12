import { Link } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
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
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-slate-200/70 bg-white/65 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 dark:border-slate-800/80 dark:bg-slate-950/45">
      <button
        type="button"
        className="shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-1 md:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex min-w-0 max-w-full items-center gap-1 sm:gap-1.5">
        <div className="min-w-0 max-w-[min(11.5rem,42vw)] sm:max-w-[10rem] md:max-w-[12rem]">
          <WorkspaceSwitcher />
        </div>
        {workspace ? (
          <Link
            to={`/workspaces/${workspace.id}/settings`}
            className="hidden shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:inline dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Settings
          </Link>
        ) : null}
        <NotificationDropdown />
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={toggleTheme}
          className="shrink-0 rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
        {user ? (
          <Link
            to="/profile"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 sm:gap-2 sm:pr-2.5 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/40"
            title="View profile"
            aria-label="View profile"
          >
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="mt-0.5 max-w-[120px] truncate text-[10px] text-slate-500 lg:max-w-[140px]">
                {user.email}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            to="/login"
            className="shrink-0 text-sm font-medium text-brand-700 dark:text-brand-300"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
