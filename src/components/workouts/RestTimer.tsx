import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, X, SkipForward, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  defaultSeconds?: number;
  isActive: boolean;
  onDismiss: (restedSeconds?: number) => void;
}

export function RestTimer({ defaultSeconds = 90, isActive, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [totalTime, setTotalTime] = useState(defaultSeconds);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isActive) return;
    setRemaining(defaultSeconds);
    setTotalTime(defaultSeconds);
    startTimeRef.current = Date.now();

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

  const elapsed = totalTime - remaining;
  const percent = (remaining / totalTime) * 100;
  const isOvertime = remaining === 0;
  const isHalfway = percent <= 50 && !isOvertime;
  const isUrgent = remaining <= 15 && !isOvertime;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Color ring: green → yellow → red
  const ringColor = isOvertime
    ? 'border-destructive'
    : isUrgent
    ? 'border-destructive'
    : isHalfway
    ? 'border-warning'
    : 'border-success';

  const handleDismiss = () => {
    const restedSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onDismiss(restedSecs);
  };

  const adjustTime = (delta: number) => {
    setRemaining(prev => Math.max(0, prev + delta));
    setTotalTime(prev => Math.max(15, prev + delta));
  };

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 rounded-2xl p-4 shadow-lg border min-w-[220px]',
      isOvertime
        ? 'bg-destructive/10 border-destructive/30 animate-pulse'
        : 'bg-card border-border'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Rest Timer</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Timer display with color ring */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-28 h-28 rounded-full border-4 flex items-center justify-center transition-colors duration-500',
          ringColor
        )}>
          <div className={cn(
            'text-3xl font-mono font-bold',
            isOvertime ? 'text-destructive' : 'text-foreground'
          )}>
            {isOvertime ? 'GO!' : `${mins}:${secs.toString().padStart(2, '0')}`}
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          {elapsed}s elapsed / {totalTime}s target
        </div>
      </div>

      {/* ±15s adjust buttons */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={() => adjustTime(-15)}
        >
          <Minus className="h-3 w-3" /> 15s
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={() => adjustTime(15)}
        >
          <Plus className="h-3 w-3" /> 15s
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            isOvertime ? 'bg-destructive' : isUrgent ? 'bg-destructive' : isHalfway ? 'bg-warning' : 'bg-success'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Start early button at 50% */}
      {isHalfway && !isOvertime && (
        <Button
          variant="default"
          size="sm"
          className="w-full mt-2 gap-1 bg-info hover:bg-info/90 text-info-foreground text-xs"
          onClick={handleDismiss}
        >
          Ready? Start Early →
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 gap-2"
        onClick={handleDismiss}
      >
        <SkipForward className="h-3 w-3" />
        {isOvertime ? 'Dismiss' : 'Skip'}
      </Button>
    </div>
  );
}
