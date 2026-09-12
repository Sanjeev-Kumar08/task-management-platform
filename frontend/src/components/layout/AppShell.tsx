import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastViewport } from '@/components/ui/Toast';
import { useSocketLifecycle } from '@/hooks/useSocket';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useState } from 'react';
import { fadeUp } from '@/lib/motion';

export function AppShell() {
  useSocketLifecycle();
  useOfflineSync();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 app-mesh" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <OfflineBanner />
        <div className="flex min-h-0 flex-1">
          <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header onMenuClick={() => setMobileNavOpen(true)} />
            <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="mx-auto flex min-h-full w-full max-w-7xl flex-col"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <ToastViewport />
    </div>
  );
}
