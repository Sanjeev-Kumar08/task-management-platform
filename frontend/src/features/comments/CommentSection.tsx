import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import * as commentService from '@/services/comment.service';
import type { Comment } from '@/types';
import { asUserRef, normalizeList } from '@/utils/normalize';
import { formatRelativeTime } from '@/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';

export function CommentSection({ taskId }: { taskId: string }) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void commentService
      .listComments(taskId)
      .then((data) => {
        if (!cancelled) setComments(normalizeList(data as Array<Comment & { _id?: string }>));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const submit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const created = await commentService.createComment(taskId, content.trim());
      setComments((prev) => [...prev, ...normalizeList([created as Comment & { _id?: string }])]);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    await commentService.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Comments</h3>
      {loading ? <p className="text-sm text-slate-500">Loading comments…</p> : null}
      <ul className="space-y-3">
        {comments.map((c) => {
          const author = asUserRef(c.userId);
          return (
            <li key={c.id} className="flex gap-2">
              <Avatar name={author.name} src={author.avatar} size="sm" />
              <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{author.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(c.createdAt)}
                    </span>
                    {user && author.id === user.id ? (
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => void remove(c.id)}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-sm">{c.content}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2">
        <Textarea
          label="Add a comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update…"
        />
        <Button size="sm" loading={sending} onClick={() => void submit()}>
          <Send className="h-3.5 w-3.5" />
          Comment
        </Button>
      </div>
    </div>
  );
}
