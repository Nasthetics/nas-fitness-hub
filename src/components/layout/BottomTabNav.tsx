import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, UtensilsCrossed, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MoreDrawer } from './MoreDrawer';

const tabs = [
  { label: 'Home',      icon: Home,            path: '/' },
  { label: 'Workout',   icon: Dumbbell,        path: '/workouts' },
  { label: 'Exercises', icon: BookOpen,         path: '/exercises' },
  { label: 'Nutrition', icon: UtensilsCrossed, path: '/nutrition' },
  { label: 'Progress',  icon: TrendingUp,      path: '/progress' },
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
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'hsl(0 0% 4% / 0.94)',
          borderTop: '1px solid hsl(0 0% 13%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top accent line that glows on active */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)',
          }}
        />

        <div className="flex items-end justify-around px-2" style={{ height: 68 }}>
          {tabs.map((tab) => {
            const isActive  = location.pathname === tab.path;
            const Icon      = tab.icon;
            const isPressed = pressing === tab.label;

            return (
              <button
                key={tab.label}
                onPointerDown={() => setPressing(tab.label)}
                onPointerUp={() => { setPressing(null); navigate(tab.path); }}
                onPointerLeave={() => setPressing(null)}
                className={cn(
                  'relative flex flex-col items-center justify-end gap-1 flex-1 pb-3 pt-2 min-w-[48px] select-none',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
                style={{
                  transform: isPressed ? 'scale(0.86)' : 'scale(1)',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
                }}
              >
                {/* Active pill background */}
                {isActive && (
                  <span
                    className="absolute inset-x-2 top-1 bottom-3.5 rounded-2xl bg-primary/12"
                    style={{ animation: 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                  />
                )}

                {/* Icon */}
                <span
                  className="relative z-10"
                  style={{
                    transform: isActive ? 'translateY(-2px) scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    filter: isActive ? 'drop-shadow(0 0 6px hsl(82 100% 67% / 0.55))' : 'none',
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'relative z-10 text-[10px] leading-none',
                    isActive ? 'font-bold' : 'font-medium',
                  )}
                  style={{
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {tab.label}
                </span>

                {/* Active dot */}
                {isActive && (
                  <span
                    className="absolute bottom-1.5 left-1/2 w-1 h-1 rounded-full bg-primary"
                    style={{
                      transform: 'translateX(-50%)',
                      animation: 'bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      boxShadow: '0 0 6px 1px hsl(82 100% 67% / 0.6)',
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
