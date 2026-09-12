import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              variants={fadeUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lift backdrop-blur-md',
                toast.type === 'error' &&
                  'border-red-200/80 bg-red-50/95 text-red-900 dark:border-red-900 dark:bg-red-950/85 dark:text-red-100',
                toast.type === 'success' &&
                  'border-brand-200/80 bg-brand-50/95 text-brand-900 dark:border-brand-800 dark:bg-brand-950/85 dark:text-brand-100',
                toast.type === 'info' &&
                  'border-slate-200/80 bg-white/95 text-slate-800 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100',
              )}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
              <p className="flex-1 text-sm leading-snug">{toast.message}</p>
              <button
                type="button"
                className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
