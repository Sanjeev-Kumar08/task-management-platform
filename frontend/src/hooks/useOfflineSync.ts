import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { flushOfflineQueue } from '@/lib/offlineQueue';
import { useUiStore } from '@/stores/uiStore';

export function useOfflineSync() {
  const online = useOnlineStatus();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (!online) return;
    void flushOfflineQueue()
      .then((n) => {
        if (n > 0) pushToast(`Synced ${n} offline action${n === 1 ? '' : 's'}`, 'success');
      })
      .catch(() => undefined);
  }, [online, pushToast]);
}
