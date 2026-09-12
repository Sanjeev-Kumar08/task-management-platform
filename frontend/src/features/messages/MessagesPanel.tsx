import { useCallback, useEffect, useState } from 'react';
import { Hash, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { useChannelSocket } from '@/hooks/useSocket';
import * as channelService from '@/services/channel.service';
import * as messageService from '@/services/message.service';
import type { Channel, Message, MessageCreatedEvent } from '@/types';
import { asUserRef, normalizeId, normalizeList } from '@/utils/normalize';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { joinRoom } from '@/lib/socket';

export function MessagesPanel({ workspaceId }: { workspaceId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void channelService
      .listChannels(workspaceId)
      .then((data) => {
        if (cancelled) return;
        const list = normalizeList(data as Array<Channel & { _id?: string }>);
        setChannels(list);
        setActiveId(list[0]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!activeId) return;
    joinRoom('join:channel', activeId);
    let cancelled = false;
    void messageService.listMessages(activeId).then((data) => {
      if (!cancelled) setMessages(normalizeList(data as Array<Message & { _id?: string }>));
    });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

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

  const send = async () => {
    if (!activeId || !content.trim()) return;
    setSending(true);
    try {
      const created = await messageService.sendMessage(activeId, content.trim());
      const msg = normalizeId(created as Message & { _id?: string });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setContent('');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading channels…</p>;
  }

  if (!channels.length) {
    return (
      <EmptyState
        icon={Hash}
        title="No channels"
        description="Channels will appear here once created for this workspace."
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <aside className="w-56 shrink-0 border-r border-slate-100 dark:border-slate-800">
        <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold">Channels</h2>
        </div>
        <ul className="p-2">
          {channels.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-900',
                  activeId === c.id &&
                    'bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200',
                )}
              >
                <Hash className="h-3.5 w-3.5" />
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="font-display font-semibold">
            #{channels.find((c) => c.id === activeId)?.name}
          </h3>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => {
            const sender = asUserRef(m.senderId);
            return (
              <div key={m.id} className="flex gap-3">
                <Avatar name={sender.name} src={sender.avatar} size="sm" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{sender.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{m.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Write a message…"
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <Button loading={sending} onClick={() => void send()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </section>
    </div>
  );
}
