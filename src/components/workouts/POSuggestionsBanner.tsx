import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface POSuggestionsBannerProps {
  exerciseCount: number;
  onApplyAll: () => void;
}

export function POSuggestionsBanner({ exerciseCount, onApplyAll }: POSuggestionsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || exerciseCount === 0) return null;

  return (
    <div className="mx-4 mt-2 flex items-center gap-3 rounded-xl bg-warning/10 border border-warning/20 px-4 py-3">
      <Lightbulb className="h-4 w-4 text-warning shrink-0" />
      <span className="text-sm text-foreground flex-1">
        💡 PO suggestions ready for {exerciseCount} exercise{exerciseCount > 1 ? 's' : ''}
      </span>
      <Button
        size="sm"
        className="h-8 bg-warning text-warning-foreground hover:bg-warning/90 text-xs shrink-0"
        onClick={() => { onApplyAll(); setDismissed(true); }}
      >
        Apply All +2.5kg
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
