import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeScale, fadeUp, transitionSlow } from '@/lib/motion';

export function AuthShell({
  title,
  subtitle,
  children,
  brandFirst = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** When true, brand name is the hero; title becomes supporting copy */
  brandFirst?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 app-mesh" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-ink-400/10 blur-3xl dark:bg-ink-300/5" />

      <motion.div
        className="relative w-full max-w-md"
        variants={fadeScale}
        initial="initial"
        animate="animate"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-lift backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/75">
          <div className="border-b border-slate-100/80 bg-gradient-to-br from-brand-50/80 via-transparent to-transparent px-8 pb-6 pt-8 dark:border-slate-800/80 dark:from-brand-950/40">
            <Link to="/login" className="mb-5 inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-base font-bold text-white shadow-sm">
                W
              </span>
              {brandFirst ? (
                <span className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  WorkSpace
                </span>
              ) : null}
            </Link>
            {brandFirst ? (
              <>
                <h1 className="font-display text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  {title}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              </>
            ) : (
              <>
                <p className="mb-1 font-display text-sm font-semibold tracking-wide text-brand-700 dark:text-brand-300">
                  WorkSpace
                </p>
                <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              </>
            )}
          </div>
          <motion.div
            className="px-8 py-7"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ ...transitionSlow, delay: 0.06 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
