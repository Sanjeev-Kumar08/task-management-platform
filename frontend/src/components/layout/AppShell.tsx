import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastViewport } from '@/components/ui/Toast';
import { useSocketLifecycle } from '@/hooks/useSocket';

export function AppShell() {
  useSocketLifecycle();

  return (
    <div className="flex h-screen flex-col bg-surface dark:bg-surface-dark">
      <OfflineBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <ToastViewport />
    </div>
  );
}
