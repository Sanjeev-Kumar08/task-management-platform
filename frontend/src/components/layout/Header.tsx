import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { GlobalSearch } from '@/features/search/GlobalSearch';
import { NotificationDropdown } from '@/features/notifications/NotificationDropdown';
import { WorkspaceSwitcher } from '@/features/workspace/WorkspaceSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/70 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/50">
      <div className="hidden min-w-0 flex-1 md:block">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <WorkspaceSwitcher />
        <NotificationDropdown />
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {user ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-1 pr-2 dark:border-slate-700">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-none">{user.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-sm text-brand-700">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
