import { Spinner } from '@/components/ui/Spinner';

export function LoadingPage({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner />
      <p className="text-sm">{label}</p>
    </div>
  );
}
