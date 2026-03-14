import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, X, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  defaultSeconds?: number;
  isActive: boolean;
  onDismiss: () => void;
}

export function RestTimer({ defaultSeconds = 90, isActive, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [startTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isActive) return;
    setRemaining(defaultSeconds);

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, defaultSeconds, playBeep]);

  if (!isActive) return null;

  const elapsed = defaultSeconds - remaining;
  const percent = (remaining / defaultSeconds) * 100;
  const isOvertime = remaining === 0;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 rounded-2xl p-4 shadow-lg border min-w-[200px]',
      isOvertime 
        ? 'bg-destructive/10 border-destructive/30 animate-pulse' 
        : 'bg-card border-border'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Rest Timer</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="text-center">
        <div className={cn(
          'text-4xl font-mono font-bold',
          isOvertime ? 'text-destructive' : 'text-foreground'
        )}>
          {isOvertime ? 'GO!' : `${mins}:${secs.toString().padStart(2, '0')}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {elapsed}s elapsed / {defaultSeconds}s target
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            isOvertime ? 'bg-destructive' : 'bg-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 gap-2"
        onClick={onDismiss}
      >
        <SkipForward className="h-3 w-3" />
        {isOvertime ? 'Dismiss' : 'Skip'}
      </Button>
    </div>
  );
}
