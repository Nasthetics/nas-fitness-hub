import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  BookOpen,
  Apple,
  ShoppingCart,
  Pill,
  FlaskConical,
  TrendingUp,
  LogOut,
  User,
  Settings,
  Heart,
  Calendar,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Workouts', url: '/workouts', icon: Dumbbell },
  { title: 'Exercises', url: '/exercises', icon: BookOpen },
  { title: 'Nutrition', url: '/nutrition', icon: Apple },
  { title: 'Groceries', url: '/groceries', icon: ShoppingCart },
  { title: 'Supplements', url: '/supplements', icon: Pill },
  { title: 'Compounds', url: '/compounds', icon: FlaskConical },
  { title: 'Progress', url: '/progress', icon: TrendingUp },
];

const advancedNavItems = [
  { title: 'Recovery', url: '/recovery', icon: Heart },
  { title: 'Periodization', url: '/periodization', icon: Calendar },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const renderNavGroup = (items: typeof mainNavItems, label: string) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    'transition-all duration-200',
                    isActive && 'bg-sidebar-accent text-primary font-medium'
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Nas Fitness OS</h1>
            <p className="text-xs text-sidebar-foreground/60">Bodybuilding Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderNavGroup(mainNavItems, 'Modules')}
        {renderNavGroup(advancedNavItems, 'Advanced')}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
            <User className="h-4 w-4 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
