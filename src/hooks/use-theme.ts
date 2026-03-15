import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'gym';

const THEME_KEY = 'theme_mode';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Remove all theme classes, add correct one
    root.classList.remove('dark', 'light', 'gym');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'gym') {
      root.classList.add('gym');
    }
    
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'gym';
      return 'dark';
    });
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
  }, []);

  return { theme, cycleTheme, setTheme };
}
