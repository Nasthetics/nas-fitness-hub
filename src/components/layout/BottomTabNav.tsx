import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, UtensilsCrossed, TrendingUp, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MoreDrawer } from './MoreDrawer';

const tabs = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Workout', icon: Dumbbell, path: '/workouts' },
  { label: 'Exercises', icon: BookOpen, path: '/exercises' },
  { label: 'Nutrition', icon: UtensilsCrossed, path: '/nutrition' },
  { label: 'Progress', icon: TrendingUp, path: '/progress' },
];

interface BottomTabNavProps {
  hidden?: boolean;
}

export function BottomTabNav({ hidden }: BottomTabNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  if (hidden) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,5%)] border-t border-border backdrop-blur"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around" style={{ height: 64 }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[48px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
