import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface PRCelebrationProps {
  show: boolean;
  exerciseName: string;
  oldRecord: string;
  newRecord: string;
  onClose: () => void;
}

export function PRCelebration({ show, exerciseName, oldRecord, newRecord, onClose }: PRCelebrationProps) {
  useEffect(() => {
    if (!show) return;
    
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
    });

    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl animate-in pointer-events-auto text-center max-w-sm">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-primary mb-1">NEW PR!</h2>
        <p className="text-lg font-semibold text-foreground">{exerciseName}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="text-muted-foreground line-through">{oldRecord}</div>
          <span className="text-primary font-bold text-xl">→</span>
          <div className="text-primary font-bold text-xl">{newRecord}</div>
        </div>
        <button 
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
