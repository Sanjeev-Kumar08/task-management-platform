import { RegisterForm } from '@/features/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-surface to-surface dark:from-brand-950 dark:via-surface-dark dark:to-surface-dark" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">
            W
          </div>
          <h1 className="font-display text-2xl font-semibold">WorkSpace</h1>
          <p className="mt-1 text-sm text-slate-500">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
