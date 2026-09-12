import { cn } from '@/utils/cn';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block space-y-1.5">
        {label ? (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-400',
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

Input.displayName = 'Input';
