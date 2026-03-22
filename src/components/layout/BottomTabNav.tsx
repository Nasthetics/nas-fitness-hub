import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, UtensilsCrossed, TrendingUp } from 'lucide-react';
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
  const [pressing, setPressing] = useState<string | null>(null);

  if (hidden) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border backdrop-blur-xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'hsl(0 0% 5% / 0.92)',
        }}
      >
        <div className="flex items-center justify-around" style={{ height: 64 }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            const isPressed = pressing === tab.label;
            return (
              <button
                key={tab.label}
                onPointerDown={() => setPressing(tab.label)}
                onPointerUp={() => { setPressing(null); navigate(tab.path); }}
                onPointerLeave={() => setPressing(null)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[48px]",
                  "transition-colors duration-150 select-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                style={{
                  transform: isPressed ? 'scale(0.88)' : 'scale(1)',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
                }}
              >
                {/* Active background pill */}
                {isActive && (
                  <span
                    className="absolute inset-x-3 top-1.5 bottom-1.5 rounded-2xl bg-primary/10"
                    style={{ animation: 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                  />
                )}

                <span
                  style={{
                    transform: isActive ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                <span
                  className={cn("text-[10px] relative z-10", isActive ? "font-bold" : "font-medium")}
                  style={{
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {tab.label}
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <span
                    className="absolute bottom-1 left-1/2 w-1 h-1 rounded-full bg-primary"
                    style={{
                      transform: 'translateX(-50%)',
                      animation: 'bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
