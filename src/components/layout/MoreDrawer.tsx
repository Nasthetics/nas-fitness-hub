import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Pill, Heart, Calendar, Bot, FileText, Settings,
  Activity, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const moreItems = [
  { label: 'Cardio', icon: Activity, path: '/cardio' },
  { label: 'Groceries', icon: ShoppingCart, path: '/groceries' },
  { label: 'Supplements', icon: Pill, path: '/supplements' },
  { label: 'Recovery', icon: Heart, path: '/recovery' },
  { label: 'Periodization', icon: Calendar, path: '/periodization' },
  { label: 'AI Coach', icon: Bot, path: '/coach' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreDrawer({ open, onOpenChange }: MoreDrawerProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-left">More</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-3 mt-4 pb-4">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  onOpenChange(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-muted transition-colors min-h-[80px] justify-center"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
