import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AppRouter } from '@/app/AppRouter';
import { ErrorFallback } from '@/components/common/ErrorFallback';
import { ConfirmDialogHost } from '@/components/ui/ConfirmDialog';
import { setApiToastHandler } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setApiToastHandler(pushToast);
    return () => setApiToastHandler(null);
  }, [pushToast]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.assign('/')}>
      <AppRouter />
      <ConfirmDialogHost />
    </ErrorBoundary>
  );
}
