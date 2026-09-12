import { useEffect, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CommentSection } from '@/features/comments/CommentSection';
import { useBoardStore } from '@/stores/boardStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useUiStore } from '@/stores/uiStore';
import * as taskService from '@/services/task.service';
import type { TaskPriority } from '@/types';
import { normalizeId } from '@/utils/normalize';
import { getApiBaseUrl } from '@/lib/api';
import { memberUser, memberUserId } from '@/utils/members';
import { fadeIn, slideInRight, transitionSlow } from '@/lib/motion';

export function TaskDrawer() {
  const selectedTaskId = useBoardStore((s) => s.selectedTaskId);
  const tasks = useBoardStore((s) => s.tasks);
  const selectTask = useBoardStore((s) => s.selectTask);
  const upsertTask = useBoardStore((s) => s.upsertTask);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const pushToast = useUiStore((s) => s.pushToast);
  const task = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelsText, setLabelsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setLabelsText((task.labels ?? []).join(', '));
  }, [task]);

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...(workspace?.members ?? []).map((m) => {
      const u = memberUser(m);
      return {
        value: memberUserId(m),
        label: `${u.name} · ${m.role}`,
      };
    }),
  ];

  const save = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const labels = labelsText
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);
      const updated = await taskService.updateTask(task.id, {
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`).toISOString() : null,
        labels,
      });
      upsertTask(normalizeId(updated as typeof task & { _id?: string }));
      if ((assigneeId || null) !== (task.assigneeId || null)) {
        const assigned = await taskService.assignTask(task.id, assigneeId || null);
        upsertTask(normalizeId(assigned as typeof task & { _id?: string }));
      }
      pushToast('Task saved', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file || !task) return;
    setUploading(true);
    try {
      const updated = await taskService.uploadAttachment(task.id, file);
      upsertTask(normalizeId(updated as typeof task & { _id?: string }));
      pushToast('Attachment uploaded', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {task ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            aria-label="Close drawer"
            onClick={() => selectTask(null)}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          />
          <motion.aside
            className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200/80 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-950"
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSlow}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-semibold tracking-tight">Task details</h2>
              <button
                type="button"
                className="rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => selectTask(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
              <Select
                label="Assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                options={memberOptions}
              />
              <Input
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Input
                label="Labels"
                placeholder="bug, frontend, urgent"
                value={labelsText}
                onChange={(e) => setLabelsText(e.target.value)}
              />
              {(task.labels ?? []).length ? (
                <div className="flex flex-wrap gap-1.5">
                  {(task.labels ?? []).map((label) => (
                    <span
                      key={label}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Attachments
                </p>
                <ul className="mb-2 space-y-1">
                  {(task.attachments ?? []).map((a) => (
                    <li
                      key={a.id ?? a.filename}
                      className="text-sm text-brand-700 dark:text-brand-300"
                    >
                      <a
                        href={`${getApiBaseUrl()}/uploads/${a.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {a.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:bg-brand-950/20">
                  <Paperclip className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload file'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <CommentSection taskId={task.id} />
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
              <Button className="flex-1" loading={saving} onClick={() => void save()}>
                Save changes
              </Button>
              <Button variant="secondary" onClick={() => selectTask(null)}>
                Close
              </Button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
