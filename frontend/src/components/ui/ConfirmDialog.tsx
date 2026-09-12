import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { Portal } from '@/components/common/Portal';
import { Button } from '@/components/ui/Button';
import { fadeIn, fadeScale } from '@/lib/motion';
import { useUiStore, type ConfirmOptions } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

export function ConfirmDialogHost() {
  const confirm = useUiStore((s) => s.confirm);
  const resolveConfirm = useUiStore((s) => s.resolveConfirm);

  return (
    <Portal>
      <AnimatePresence>
        {confirm ? (
          <ConfirmDialog
            key={confirm.id}
            options={confirm}
            onResolve={resolveConfirm}
          />
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

function ConfirmDialog({
  options,
  onResolve,
}: {
  options: ConfirmOptions;
  onResolve: (confirmed: boolean) => void;
}) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const tone = options.tone ?? 'danger';
  const confirmLabel = options.confirmLabel ?? (tone === 'danger' ? 'Delete' : 'Confirm');
  const cancelLabel = options.cancelLabel ?? 'Cancel';

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onResolve(false);
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onResolve]);

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <motion.button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={() => onResolve(false)}
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-950"
        variants={fadeScale}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="p-6">
          <div className="flex gap-4">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                tone === 'danger'
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300'
                  : 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight">
                {options.title}
              </h2>
              <p id={descId} className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {options.description}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onResolve(false)}>
              {cancelLabel}
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => onResolve(true)}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
