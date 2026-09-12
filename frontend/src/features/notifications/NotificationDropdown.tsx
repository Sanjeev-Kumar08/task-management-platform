import { Portal } from '@/components/common/Portal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { easeOut, fadeIn, transition } from '@/lib/motion';
import * as invitationService from '@/services/invitation.service';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiStore } from '@/stores/uiStore';
import type { Notification } from '@/types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/format';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function resolveStaticPath(n: Notification): string | null {
  if (n.actionUrl) {
    try {
      if (n.actionUrl.startsWith('http')) {
        const url = new URL(n.actionUrl);
        return `${url.pathname}${url.search}${url.hash}`;
      }
      return n.actionUrl;
    } catch {
      return n.actionUrl.startsWith('/') ? n.actionUrl : null;
    }
  }

  if (n.entityType === 'Workspace' && n.entityId) {
    return `/workspaces/${n.entityId}`;
  }

  return null;
}

type PanelPos = { top: number; left: number; width: number };

const PANEL_WIDTH = 320;
const PANEL_MAX_HEIGHT = 360;

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const loadingMore = useNotificationStore((s) => s.loadingMore);
  const hasMore = useNotificationStore((s) => s.hasMore);
  const fetchInitial = useNotificationStore((s) => s.fetchInitial);
  const fetchMore = useNotificationStore((s) => s.fetchMore);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const sentinelRef = useInfiniteScroll(fetchMore, open && hasMore);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const margin = 12;
    const width = Math.min(PANEL_WIDTH, window.innerWidth - margin * 2);
    let left = rect.right - width;
    left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
    const top = Math.min(rect.bottom + gap, window.innerHeight - 120);
    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) void fetchInitial();
  }, [open, fetchInitial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  const openNotification = async (n: Notification) => {
    setOpeningId(n.id);
    try {
      await markRead(n.id);

      let path = resolveStaticPath(n);

      if (!path && n.type === 'WORKSPACE_INVITE' && n.entityType === 'Invitation' && n.entityId) {
        const opened = await invitationService.openInvitation(n.entityId);
        path = opened.path;
      }

      if (!path) {
        pushToast('No action available for this notification', 'info');
        return;
      }

      close();
      navigate(path);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not open notification', 'error');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          open && 'bg-slate-100 dark:bg-slate-800',
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-md bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <Portal>
        <AnimatePresence>
          {open && pos ? (
            <div className="fixed inset-0 z-[230]">
              <motion.button
                type="button"
                className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]"
                aria-label="Close notifications"
                onClick={close}
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
              />
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-label="Notifications"
                className="absolute overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lift backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  maxHeight: PANEL_MAX_HEIGHT,
                  transformOrigin: 'top right',
                }}
                initial={{ opacity: 0, y: -14, scaleY: 0.92, scaleX: 0.98 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scaleY: 1,
                  scaleX: 1,
                  transition: { duration: 0.32, ease: easeOut },
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.96,
                  transition: { duration: 0.2, ease: easeOut },
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                  <p className="text-sm font-semibold tracking-tight">Notifications</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
                    onClick={() => void markAllRead()}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                </div>
                <motion.div
                  className="overflow-y-auto overscroll-contain"
                  style={{ maxHeight: PANEL_MAX_HEIGHT - 48 }}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: 0.035, delayChildren: 0.05 },
                    },
                  }}
                >
                  {loading && !items.length ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : null}
                  {!loading && !items.length ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>
                  ) : null}
                  {items.map((n) => (
                    <motion.button
                      key={n.id}
                      type="button"
                      disabled={openingId === n.id}
                      variants={{
                        hidden: { opacity: 0, y: -6 },
                        show: { opacity: 1, y: 0, transition },
                      }}
                      className={cn(
                        'block w-full border-b border-slate-50 px-3.5 py-3 text-left transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:hover:bg-slate-800/60',
                        !n.read && 'bg-brand-50/40 dark:bg-brand-950/20',
                      )}
                      onClick={() => void openNotification(n)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                        {openingId === n.id ? (
                          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
                        ) : null}
                      </div>
                    </motion.button>
                  ))}
                  <div ref={sentinelRef} className="h-4" />
                  {loadingMore ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </Portal>
    </>
  );
}
