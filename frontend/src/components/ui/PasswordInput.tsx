import { cn } from '@/utils/cn';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <label className="block space-y-1.5">
        {label ? (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-11 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-400',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={visible ? 'Hide password' : 'Show password'}
            title={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
      </label>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
