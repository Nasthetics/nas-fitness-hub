import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomTabNav } from './BottomTabNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, createContext, useContext } from 'react';

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
  const isMobile = useIsMobile();
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);

  return (
    <WorkoutModeContext.Provider value={{ isWorkoutMode, setIsWorkoutMode }}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full dark">
          {/* Desktop sidebar */}
          {!isMobile && <AppSidebar />}
          
          <SidebarInset className="flex flex-col flex-1">
            {/* Header - hidden in workout mode */}
            {!isWorkoutMode && (
              <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
                {!isMobile && <SidebarTrigger className="-ml-2" />}
                {isMobile && <span className="text-lg font-bold text-foreground">Nas Fitness OS</span>}
              </header>
            )}
            <main className={`flex-1 overflow-auto ${isWorkoutMode ? '' : 'p-4 md:p-6'} ${isMobile && !isWorkoutMode ? 'pb-24' : ''}`}>
              <Outlet />
            </main>
          </SidebarInset>
        </div>

        {/* Mobile bottom nav - hidden in workout mode */}
        {isMobile && <BottomTabNav hidden={isWorkoutMode} />}
      </SidebarProvider>
    </WorkoutModeContext.Provider>
  );
}
