import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {error.message || 'An unexpected error occurred.'}
        </p>
      </div>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}
