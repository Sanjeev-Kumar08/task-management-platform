import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-soft backdrop-blur',
            toast.type === 'error' &&
              'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/80 dark:text-red-100',
            toast.type === 'success' &&
              'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/80 dark:text-brand-100',
            toast.type === 'info' &&
              'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          )}
          role="status"
        >
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            type="button"
            className="rounded p-0.5 opacity-70 hover:opacity-100"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
