import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Hash, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { useChannelSocket } from '@/hooks/useSocket';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuthStore } from '@/stores/authStore';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import { enqueueOfflineMutation } from '@/lib/offlineQueue';
import * as channelService from '@/services/channel.service';
import * as messageService from '@/services/message.service';
import type { Channel, Message, MessageCreatedEvent } from '@/types';
import { asUserRef, normalizeId, normalizeList } from '@/utils/normalize';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { joinRoom } from '@/lib/socket';
import { canManageMembers, myWorkspaceRole } from '@/utils/members';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function MessagesPanel({ workspaceId }: { workspaceId: string }) {
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const pushToast = useUiStore((s) => s.pushToast);
  const online = useOnlineStatus();
  const role = myWorkspaceRole(workspace, user?.id);
  const canManage = canManageMembers(role);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadChannels = useCallback(async () => {
    const data = await channelService.listChannels(workspaceId);
    const list = normalizeList(data as Array<Channel & { _id?: string }>);
    setChannels(list);
    setActiveId((prev) => prev ?? list[0]?.id ?? null);
  }, [workspaceId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMobileView('list');
    void loadChannels()
      .catch((err) => pushToast(err instanceof Error ? err.message : 'Failed to load channels', 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadChannels, pushToast]);

  useEffect(() => {
    if (!activeId) return;
    joinRoom('join:channel', activeId);
    let cancelled = false;
    void messageService
      .listMessages(activeId)
      .then((page) => {
        if (cancelled) return;
        const items = Array.isArray(page)
          ? page
          : ((page as { items?: Message[] }).items ?? []);
        setMessages(normalizeList(items as Array<Message & { _id?: string }>));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    void channelService.markChannelRead(workspaceId, activeId).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeId, workspaceId]);

  const onMessage = useCallback(
    (event: MessageCreatedEvent) => {
      const msg = normalizeId(event.message as Message & { _id?: string });
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (String(msg.channelId) !== activeId) return prev;
        return [...prev, msg];
      });
    },
    [activeId],
  );

  useChannelSocket(activeId ?? undefined, onMessage);

  const selectChannel = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
  };

  const createChannel = async () => {
    if (!newChannel.trim()) return;
    try {
      const created = await channelService.createChannel(workspaceId, {
        name: newChannel.trim(),
        type: 'PUBLIC',
      });
      const channel = normalizeId(created as Channel & { _id?: string });
      setChannels((prev) => [...prev, channel]);
      setActiveId(channel.id);
      setMobileView('chat');
      setNewChannel('');
      pushToast('Channel created', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not create channel', 'error');
    }
  };

  const archiveActive = async () => {
    if (!activeId) return;
    const ok = await confirmDialog({
      title: 'Archive channel',
      description: 'Archive this channel? It will be hidden from the channel list.',
      confirmLabel: 'Archive channel',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await channelService.archiveChannel(workspaceId, activeId);
      setChannels((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId(null);
      setMobileView('list');
      pushToast('Channel archived', 'success');
      await loadChannels();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Archive failed', 'error');
    }
  };

  const send = async () => {
    if (!activeId || !content.trim()) return;
    const text = content.trim();
    if (!online) {
      enqueueOfflineMutation({ type: 'sendMessage', channelId: activeId, content: text });
      setContent('');
      pushToast('Message queued offline', 'info');
      return;
    }
    setSending(true);
    try {
      const created = await messageService.sendMessage(activeId, text);
      const msg = normalizeId(created as Message & { _id?: string });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setContent('');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      const updated = await messageService.updateMessage(messageId, editContent.trim());
      const msg = normalizeId(updated as Message & { _id?: string });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      setEditingId(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Edit failed', 'error');
    }
  };

  const remove = async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: '[deleted]', deletedAt: new Date().toISOString() } : m,
        ),
      );
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading channels…</p>;
  }

  const activeChannel = channels.find((c) => c.id === activeId);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-800/80 dark:bg-slate-950">
      <aside
        className={cn(
          'w-full shrink-0 flex-col border-r border-slate-100 dark:border-slate-800/80 md:flex md:w-56 lg:w-64',
          mobileView === 'chat' ? 'hidden' : 'flex',
        )}
      >
        <div className="border-b border-slate-100 px-3 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-semibold tracking-tight">Channels</h2>
        </div>
        {canManage ? (
          <div className="flex gap-1.5 border-b border-slate-100 p-2 dark:border-slate-800">
            <input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="New channel"
              className="h-8 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => void createChannel()}
              className="rounded-lg border border-slate-300 p-1.5 transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Create channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!channels.length ? (
            <div className="p-3">
              <EmptyState
                icon={Hash}
                title="No channels"
                description={canManage ? 'Create one to start chatting.' : 'Ask an admin to create a channel.'}
              />
            </div>
          ) : (
            <ul className="p-2">
              {channels.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectChannel(c.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-900',
                      activeId === c.id &&
                        'bg-brand-100 font-medium text-brand-900 dark:bg-brand-900/50 dark:text-brand-100',
                    )}
                  >
                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    {(c.unreadCount ?? 0) > 0 ? (
                      <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          'min-w-0 flex-1 flex-col',
          mobileView === 'list' ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMobileView('list')}
              aria-label="Back to channels"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="truncate font-display font-semibold">
              #{activeChannel?.name ?? 'channel'}
            </h3>
          </div>
          {canManage && activeId ? (
            <Button size="sm" variant="ghost" onClick={() => void archiveActive()}>
              Archive
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {!activeId ? (
            <EmptyState
              icon={Hash}
              title="Select a channel"
              description="Pick a channel from the list to start chatting."
            />
          ) : (
            messages.map((m) => {
              const sender = asUserRef(m.senderId);
              const isOwn = user && sender.id === user.id;
              return (
                <div key={m.id} className="flex gap-2.5 sm:gap-3">
                  <Avatar name={sender.name} src={sender.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold">{sender.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(m.createdAt)}
                        {m.editedAt ? ' · edited' : ''}
                      </span>
                      {isOwn && !m.deletedAt ? (
                        <span className="ml-auto flex gap-1">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => {
                              setEditingId(m.id);
                              setEditContent(m.content);
                            }}
                            aria-label="Edit message"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => void remove(m.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : null}
                    </div>
                    {editingId === m.id ? (
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-8 min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <Button size="sm" onClick={() => void saveEdit(m.id)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <p className="break-words text-sm text-slate-700 dark:text-slate-200">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 p-2.5 dark:border-slate-800 sm:p-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={online ? 'Write a message…' : 'Offline — queued on send'}
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            disabled={!activeId}
          />
          <Button
            loading={sending}
            onClick={() => void send()}
            disabled={!activeId}
            className="shrink-0 px-3 sm:px-4"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
