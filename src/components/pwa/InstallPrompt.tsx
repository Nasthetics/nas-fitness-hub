import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone } from 'lucide-react';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (localStorage.getItem('pwa_banner_dismissed')) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShow(true), 3000);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPromptRef.current = e;
        setTimeout(() => setShow(true), 3000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      await deferredPromptRef.current.userChoice;
    }
    dismiss();
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-card border-b border-border shadow-md">
      <div className="flex items-center gap-2 px-3 py-2 max-w-screen-lg mx-auto" style={{ height: 56 }}>
        <Smartphone className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">
          {isIOS
            ? 'Tap Share → Add to Home Screen'
            : 'Add Nas Fitness OS to your home screen'}
        </p>
        {!isIOS && (
          <Button size="sm" onClick={handleInstall} className="h-7 px-3 text-xs rounded-md shrink-0">
            Install
          </Button>
        )}
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useInstallBannerVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('pwa_banner_dismissed')) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  return visible;
}
