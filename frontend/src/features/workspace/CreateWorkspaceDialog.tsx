import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Portal } from '@/components/common/Portal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from '@/lib/validators';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useUiStore } from '@/stores/uiStore';
import { fadeIn, fadeScale } from '@/lib/motion';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function CreateWorkspaceDialog({ open, onClose }: CreateWorkspaceDialogProps) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const close = () => {
    reset({ name: '', slug: '', description: '' });
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const workspace = await createWorkspace({
        name: values.name.trim(),
        slug: values.slug?.trim() || slugify(values.name) || undefined,
        description: values.description?.trim() || undefined,
      });
      pushToast('Workspace created', 'success');
      close();
      navigate(`/workspaces/${workspace.id}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to create workspace', 'error');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.button
              type="button"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
              aria-label="Close"
              onClick={close}
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-workspace-title"
              className="relative max-h-[min(90vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lift dark:border-slate-800 dark:bg-slate-950"
              variants={fadeScale}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2
                id="create-workspace-title"
                className="font-display text-xl font-semibold tracking-tight"
              >
                Create workspace
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                A workspace is your team&apos;s home for projects, boards, and messages.
              </p>
              <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
                <Input
                  label="Workspace name"
                  placeholder="e.g. Trex, Acme Inc"
                  autoFocus
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="URL slug (optional)"
                  placeholder="Leave blank to generate from the name"
                  error={errors.slug?.message}
                  {...register('slug')}
                />
                <Textarea
                  label="Description (optional)"
                  rows={3}
                  placeholder="What is this workspace for?"
                  error={errors.description?.message}
                  {...register('description')}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Create workspace
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}
