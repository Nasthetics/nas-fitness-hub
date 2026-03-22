import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabNav } from './BottomTabNav';
import { ThemeToggle } from './ThemeToggle';
import { useState, createContext, useContext, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { InstallPrompt, useInstallBannerVisible } from '@/components/pwa/InstallPrompt';

interface WorkoutModeContextType {
  isWorkoutMode: boolean;
  setIsWorkoutMode: (v: boolean) => void;
}

export const WorkoutModeContext = createContext<WorkoutModeContextType>({
  isWorkoutMode: false,
  setIsWorkoutMode: () => {},
});

export const useWorkoutMode = () => useContext(WorkoutModeContext);

export function AppLayout() {
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);
  const { theme } = useTheme();
  const bannerVisible = useInstallBannerVisible();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'gym');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <WorkoutModeContext.Provider value={{ isWorkoutMode, setIsWorkoutMode }}>
      <InstallPrompt />
      <div className="flex flex-col min-h-screen w-full" style={{ paddingTop: bannerVisible ? 56 : 0 }}>
        {!isWorkoutMode && (
          <div className="fixed top-3 right-3 z-40" style={{ top: bannerVisible ? 56 + 12 : 12 }}>
            <ThemeToggle />
          </div>
        )}
        <main
          key={location.pathname}
          className={`flex-1 overflow-auto ${isWorkoutMode ? '' : 'p-4 md:p-6'} ${!isWorkoutMode ? 'pb-24' : ''}`}
          style={{
            paddingBottom: isWorkoutMode ? undefined : 'calc(80px + env(safe-area-inset-bottom, 0px))',
            animation: 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <Outlet />
        </main>
      </div>
      <BottomTabNav hidden={isWorkoutMode} />
    </WorkoutModeContext.Provider>
  );
}
