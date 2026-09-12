import { useEffect, useState } from 'react';
import { useBoardStore } from '@/stores/boardStore';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const setOffline = useBoardStore((s) => s.setOffline);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setOffline(false);
    };
    const onOffline = () => {
      setOnline(false);
      setOffline(true);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOffline]);

  return online;
}
