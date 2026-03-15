import { Sun, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const { toast } = useToast();

  const handleCycle = () => {
    cycleTheme();
    const next = theme === 'dark' ? 'Light' : theme === 'light' ? 'Gym' : 'Dark';
    toast({ title: `${next} Mode activated`, duration: 1500 });
  };

  const icon = theme === 'dark' ? <Moon className="h-4 w-4" /> 
    : theme === 'light' ? <Sun className="h-4 w-4" /> 
    : <Zap className="h-4 w-4" />;

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCycle} title={`${theme} mode`}>
      {icon}
    </Button>
  );
}
