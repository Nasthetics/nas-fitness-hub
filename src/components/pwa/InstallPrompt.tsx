import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone } from 'lucide-react';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (localStorage.getItem('pwa_prompt_shown')) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return; // Already installed

    setIsIOS(ios);

    if (ios) {
      // Show after a short delay
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
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in rounded-xl bg-card border border-border shadow-xl p-4 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/20 shrink-0">
          <Smartphone className="h-5 w-5 text-info" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            📱 Add to Home Screen for the best gym experience
          </p>
          {isIOS && (
            <p className="text-xs text-muted-foreground mt-1">
              Tap <span className="font-medium">Share</span> → <span className="font-medium">Add to Home Screen</span>
            </p>
          )}
          <div className="flex gap-2 mt-3">
            {!isIOS && (
              <Button size="sm" onClick={handleInstall} className="bg-info hover:bg-info/90 text-info-foreground rounded-lg">
                Add to Home Screen
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={dismiss} className="text-muted-foreground">
              Not now
            </Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
