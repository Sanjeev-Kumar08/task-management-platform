import { cn } from '@/utils/cn';
import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block space-y-1.5">
        {label ? (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-[96px] w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      </label>
    );
  },
);

Textarea.displayName = 'Textarea';
