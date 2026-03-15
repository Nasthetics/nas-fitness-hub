import { Outlet } from 'react-router-dom';
import { BottomTabNav } from './BottomTabNav';
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
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);

  return (
    <WorkoutModeContext.Provider value={{ isWorkoutMode, setIsWorkoutMode }}>
      <div className="flex flex-col min-h-screen w-full dark">
        <main className={`flex-1 overflow-auto ${isWorkoutMode ? '' : 'p-4 md:p-6'} ${!isWorkoutMode ? 'pb-24' : ''}`}>
          <Outlet />
        </main>
      </div>
      <BottomTabNav hidden={isWorkoutMode} />
    </WorkoutModeContext.Provider>
  );
}
