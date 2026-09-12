import { Portal } from '@/components/common/Portal';
import { easeOut, transition } from '@/lib/motion';
import { cn } from '@/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectChangeEvent = ChangeEvent<HTMLInputElement>;

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: SelectChangeEvent) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
  title?: string;
  size?: 'sm' | 'md';
}

type PanelPos = { top: number; left: number; width: number; openUp: boolean };

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    }
  };
}

function emitChange(
  onChange: SelectProps['onChange'],
  name: string | undefined,
  next: string,
) {
  if (!onChange) return;
  onChange({
    target: { value: next, name: name ?? '' },
    currentTarget: { value: next, name: name ?? '' },
  } as SelectChangeEvent);
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      value,
      defaultValue = '',
      onChange,
      onBlur,
      name,
      disabled,
      placeholder = 'Select…',
      id,
      title,
      size = 'md',
      'aria-label': ariaLabel,
    },
    ref,
  ) => {
    const reactId = useId();
    const listboxId = `${reactId}-listbox`;
    const inputId = id ?? name ?? reactId;
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const current = isControlled ? value : uncontrolled;

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [pos, setPos] = useState<PanelPos | null>(null);

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === current);
    const enabledIndexes = useMemo(
      () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
      [options],
    );

    const updatePosition = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelMax = 280;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < Math.min(panelMax, options.length * 48 + 16) && spaceAbove > spaceBelow;
      setPos({
        top: openUp ? rect.top - gap : rect.bottom + gap,
        left: rect.left,
        width: Math.max(rect.width, 160),
        openUp,
      });
    }, [options.length]);

    useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
      const onScroll = () => updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', onScroll, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', onScroll, true);
      };
    }, [open, updatePosition]);

    useEffect(() => {
      if (!open) return;
      const onPointer = (e: MouseEvent) => {
        const t = e.target as Node;
        if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
        setOpen(false);
      };
      const onKey = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener('mousedown', onPointer);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onPointer);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const idx = options.findIndex((o) => o.value === current && !o.disabled);
      setActiveIndex(idx >= 0 ? idx : (enabledIndexes[0] ?? -1));
    }, [open, current, options, enabledIndexes]);

    const commit = (next: string) => {
      if (!isControlled) setUncontrolled(next);
      if (hiddenRef.current) hiddenRef.current.value = next;
      emitChange(onChange, name, next);
      setOpen(false);
      triggerRef.current?.focus();
    };

    const moveActive = (dir: 1 | -1) => {
      if (!enabledIndexes.length) return;
      const posInEnabled = enabledIndexes.indexOf(activeIndex);
      const start = posInEnabled === -1 ? (dir === 1 ? -1 : enabledIndexes.length) : posInEnabled;
      const next = enabledIndexes[(start + dir + enabledIndexes.length) % enabledIndexes.length];
      setActiveIndex(next);
    };

    const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!open) {
          updatePosition();
          setOpen(true);
        } else if (e.key === 'Enter' || e.key === ' ') {
          const opt = options[activeIndex];
          if (opt && !opt.disabled) commit(opt.value);
        } else {
          moveActive(1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) {
          updatePosition();
          setOpen(true);
        } else {
          moveActive(-1);
        }
      } else if (e.key === 'Home' && open) {
        e.preventDefault();
        setActiveIndex(enabledIndexes[0] ?? -1);
      } else if (e.key === 'End' && open) {
        e.preventDefault();
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
      }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
    };

    return (
      <div
        ref={rootRef}
        className={cn('relative', label ? 'block space-y-1.5' : undefined, className)}
      >
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        ) : null}

        <input
          ref={mergeRefs(ref, hiddenRef)}
          type="hidden"
          id={inputId}
          name={name}
          value={current}
          onChange={() => undefined}
          onBlur={handleBlur}
          disabled={disabled}
        />

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          title={title ?? selected?.label}
          aria-label={ariaLabel ?? label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => {
            if (disabled) return;
            if (!open) updatePosition();
            setOpen((v) => !v);
          }}
          onKeyDown={onTriggerKeyDown}
          className={cn(
            'group flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white text-left text-sm text-slate-900 shadow-sm outline-none transition-[border-color,box-shadow,background-color,color] duration-200',
            'hover:border-slate-300 hover:bg-slate-50/80',
            'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900',
            open && 'border-brand-500 ring-2 ring-brand-500/20',
            error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20',
            size === 'sm' ? 'h-9 px-2.5' : 'h-10 px-3.5',
          )}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate leading-snug',
              !selected && 'text-slate-400',
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}

        <Portal>
          <AnimatePresence>
            {open && pos ? (
              <motion.div
                ref={panelRef}
                id={listboxId}
                role="listbox"
                aria-labelledby={inputId}
                className="fixed z-[240] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lift backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                style={{
                  left: pos.left,
                  width: pos.width,
                  top: pos.openUp ? undefined : pos.top,
                  bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
                  transformOrigin: pos.openUp ? 'bottom center' : 'top center',
                  maxHeight: 280,
                }}
                initial={{
                  opacity: 0,
                  y: pos.openUp ? 12 : -12,
                  scaleY: 0.92,
                  scaleX: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scaleY: 1,
                  scaleX: 1,
                  transition: { duration: 0.32, ease: easeOut },
                }}
                exit={{
                  opacity: 0,
                  y: pos.openUp ? 8 : -8,
                  scaleY: 0.96,
                  scaleX: 0.99,
                  transition: { duration: 0.2, ease: easeOut },
                }}
              >
                <motion.ul
                  className="max-h-[280px] overflow-y-auto overscroll-contain py-1.5"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: {
                      transition: { staggerChildren: 0.028, delayChildren: 0.04 },
                    },
                  }}
                >
                  {options.length === 0 ? (
                    <li className="px-3.5 py-2.5 text-sm text-slate-400">No options</li>
                  ) : (
                    options.map((opt, index) => {
                      const isSelected = opt.value === current;
                      const isActive = index === activeIndex;
                      return (
                        <motion.li
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={opt.disabled || undefined}
                          variants={{
                            hidden: { opacity: 0, y: pos.openUp ? 6 : -6 },
                            show: { opacity: 1, y: 0, transition },
                          }}
                          className="px-1.5"
                        >
                          <button
                            type="button"
                            disabled={opt.disabled}
                            tabIndex={-1}
                            onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                            onClick={() => {
                              if (!opt.disabled) commit(opt.value);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm leading-snug transition-colors duration-150',
                              'disabled:cursor-not-allowed disabled:opacity-40',
                              isActive && !isSelected && 'bg-slate-100/90 dark:bg-slate-800/80',
                              isSelected &&
                                'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950/40 dark:text-brand-200',
                              !isSelected &&
                                !isActive &&
                                'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60',
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate leading-snug">{opt.label}</span>
                            <AnimatePresence initial={false}>
                              {isSelected ? (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.6 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.6 }}
                                  transition={{ duration: 0.18, ease: easeOut }}
                                  className="shrink-0 text-brand-600 dark:text-brand-300"
                                >
                                  <Check className="h-4 w-4" strokeWidth={2.5} />
                                </motion.span>
                              ) : (
                                <span className="h-4 w-4 shrink-0" aria-hidden />
                              )}
                            </AnimatePresence>
                          </button>
                        </motion.li>
                      );
                    })
                  )}
                </motion.ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Portal>
      </div>
    );
  },
);

Select.displayName = 'Select';
