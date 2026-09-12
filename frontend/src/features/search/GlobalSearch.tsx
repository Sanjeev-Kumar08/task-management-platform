import { useEffect, useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import * as searchService from '@/services/search.service';
import type { SearchResults } from '@/types';
import { normalizeList } from '@/utils/normalize';

export function GlobalSearch() {
  const open = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setSearchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!open || !debounced.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void searchService
      .search(debounced, workspaceId)
      .then((data) => {
        if (cancelled) return;
        setResults({
          projects: normalizeList(data.projects as never),
          tasks: normalizeList(data.tasks as never),
          comments: normalizeList(data.comments as never),
        });
      })
      .catch(() => {
        if (!cancelled) setResults({ projects: [], tasks: [], comments: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, workspaceId]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Search projects and tasks…</span>
        <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-700">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 dark:border-slate-800">
          <SearchIcon className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              setSearchOpen(false);
              setQuery('');
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? <p className="px-3 py-4 text-sm text-slate-500">Searching…</p> : null}
          {!loading && results && !results.projects.length && !results.tasks.length ? (
            <p className="px-3 py-4 text-sm text-slate-500">No results</p>
          ) : null}
          {results?.projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setSearchOpen(false);
                navigate(`/projects/${p.id}`);
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Project</p>
              <p className="text-sm font-medium">{p.name}</p>
            </button>
          ))}
          {results?.tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setSearchOpen(false);
                navigate(`/boards/${t.boardId}`);
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Task</p>
              <p className="text-sm font-medium">{t.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
