import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSynced, setShowSynced] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowSynced(true);
        setTimeout(() => setShowSynced(false), 3000);
      }
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showSynced) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium transition-all duration-300',
      !isOnline && 'bg-warning/90 text-warning-foreground',
      showSynced && 'bg-success/90 text-success-foreground',
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>📡 Offline · changes saved locally</span>
        </>
      ) : showSynced ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span>✓ Synced</span>
        </>
      ) : null}
    </div>
  );
}
