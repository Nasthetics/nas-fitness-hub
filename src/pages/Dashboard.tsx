import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import {
  Dumbbell, Apple, BarChart3, ChevronRight, Clock,
  Flame, CalendarDays, Zap, Beef, Wheat, Droplets,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useTodayWorkout, useWorkoutLogs, useMealLogs, useWorkoutTemplates, useProfile,
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DeloadBanner } from '@/components/workouts/DeloadBanner';
import { TargetEditModal } from '@/components/dashboard/TargetEditModal';

// Dot color per workout day type (for week pills)
const DAY_TYPE_DOT: Record<WorkoutDayType, string> = {
  shoulders_arms: 'bg-purple-400',
  chest_back:     'bg-blue-400',
  legs:           'bg-emerald-400',
  rest:           'bg-muted-foreground/40',
};

// Workout card gradient per day type
const DAY_TYPE_CARD: Record<WorkoutDayType, { bg: string; badge: string }> = {
  shoulders_arms: {
    bg: 'linear-gradient(135deg, hsl(270 70% 45%) 0%, hsl(265 60% 35%) 100%)',
    badge: 'bg-white/15 text-white',
  },
  chest_back: {
    bg: 'linear-gradient(135deg, hsl(210 80% 45%) 0%, hsl(205 70% 35%) 100%)',
    badge: 'bg-white/15 text-white',
  },
  legs: {
    bg: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(82 80% 45%) 100%)',
    badge: 'bg-black/20 text-primary-foreground',
  },
  rest: {
    bg: 'hsl(var(--card))',
    badge: 'bg-muted text-muted-foreground',
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today     = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: todayWorkout }   = useTodayWorkout();
  const { data: weeklyWorkouts } = useWorkoutLogs(weekStart, weekEnd);
  const { data: todayMeals }     = useMealLogs(today);
  const { data: profile }        = useProfile();
  const { data: templates }      = useWorkoutTemplates();

  // Workout streak
  const { data: allWorkouts = [] } = useQuery({
    queryKey: ['workout-streak', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('workout_logs')
        .select('workout_date')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('workout_date', { ascending: false })
        .limit(60);
      return data || [];
    },
    enabled: !!user,
  });

  const streak = useMemo(() => {
    if (allWorkouts.length === 0) return 0;
    let count = 0;
    let checkDate = new Date();
    const todayHasWorkout = allWorkouts.some(w => w.workout_date === format(checkDate, 'yyyy-MM-dd'));
    if (!todayHasWorkout) checkDate = subDays(checkDate, 1);
    const dates = new Set(allWorkouts.map(w => w.workout_date));
    while (dates.has(format(checkDate, 'yyyy-MM-dd'))) {
      count++;
      checkDate = subDays(checkDate, 1);
    }
    return count;
  }, [allWorkouts]);

  const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayTemplate  = templates?.find(t => t.day_number === todayDayNumber);
  const todayDayInfo   = todayTemplate ? WORKOUT_DAY_INFO[todayTemplate.day_type as WorkoutDayType] : null;
  const isRestDay      = todayTemplate?.day_type === 'rest';
  const isTrainingDay  = todayTemplate?.day_type !== 'rest';

  const targetCalories = isTrainingDay ? (profile?.training_day_calories || 2556) : (profile?.rest_day_calories || 2556);
  const targetProtein  = isTrainingDay ? (profile?.training_day_protein  || 180)  : (profile?.rest_day_protein  || 180);
  const targetCarbs    = isTrainingDay ? (profile?.training_day_carbs    || 300)  : (profile?.rest_day_carbs    || 250);
  const targetFats     = isTrainingDay ? (profile?.training_day_fats     || 70)   : (profile?.rest_day_fats     || 70);

  const nutritionStats = useMemo(() => {
    if (!todayMeals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return todayMeals.reduce((acc, meal) => {
      meal.meal_items?.forEach(item => {
        acc.calories += Number(item.calories) || 0;
        acc.protein  += Number(item.protein)  || 0;
        acc.carbs    += Number(item.carbs)    || 0;
        acc.fats     += Number(item.fats)     || 0;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [todayMeals]);

  const weeklyCompletedCount = weeklyWorkouts?.filter(w => w.completed).length || 0;

  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.display_name || 'Nas';
  const initials    = displayName.charAt(0).toUpperCase();

  // Week day pills
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx  = (new Date().getDay() + 6) % 7;
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);

  const selectedDayNumber = selectedDayIdx + 1;
  const selectedTemplate  = templates?.find(t => t.day_number === selectedDayNumber);
  const selectedDayInfo   = selectedTemplate ? WORKOUT_DAY_INFO[selectedTemplate.day_type as WorkoutDayType] : null;

  const [editTarget, setEditTarget] = useState<any>(null);

  // Today's workout card style
  const todayDayType  = todayTemplate?.day_type as WorkoutDayType | undefined;
  const cardStyle     = todayDayType ? DAY_TYPE_CARD[todayDayType] : DAY_TYPE_CARD.rest;
  const cardIsColored = todayDayType && todayDayType !== 'rest';

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center justify-between animate-slide-up animate-delay-75">
        <div>
          <p className="text-xs text-muted-foreground">
            {greeting} · {format(new Date(), 'EEEE, MMM d')}
          </p>
          <h1 className="text-2xl font-bold gradient-text leading-tight">{displayName}</h1>
        </div>
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 border-2 border-primary/40 text-foreground font-bold text-sm glow-primary">
            {initials}
          </div>
          {streak > 0 && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white border-2 border-background">
              🔥
            </span>
          )}
        </div>
      </div>

      {/* Deload Banner */}
      <DeloadBanner />

      {/* ── Stat chips ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          iconBg="bg-orange-500/15"
          value={streak}
          label="Day Streak"
          delay="animate-delay-100"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4 text-blue-400" />}
          iconBg="bg-blue-500/15"
          value={weeklyCompletedCount}
          label="This Week"
          delay="animate-delay-150"
        />
        <StatCard
          icon={<Zap className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/15"
          value={Math.round(nutritionStats.calories)}
          label="Kcal Today"
          delay="animate-delay-200"
        />
      </div>

      {/* ── Today Workout Card ──────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer card-hover glow-primary-animated animate-scale-in animate-delay-200"
        onClick={() => navigate('/workouts')}
        style={{ background: cardStyle.bg }}
      >
        {/* Subtle dot pattern */}
        {cardIsColored && (
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
        )}

        <div className="relative p-5">
          <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${cardIsColored ? 'text-white/60' : 'text-muted-foreground'}`}>
            Today
          </p>
          <h2 className={`text-xl font-bold ${cardIsColored ? 'text-white' : 'text-foreground'}`}>
            {isRestDay ? '😴 Rest Day' : (todayDayInfo?.label || 'No Plan Set')}
          </h2>

          {!isRestDay && todayDayInfo?.muscles && todayDayInfo.muscles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {todayDayInfo.muscles.map(m => (
                <span
                  key={m}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cardStyle.badge}`}
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {!isRestDay && (
            <div className="flex items-center justify-between mt-4">
              <span className={`flex items-center gap-1.5 text-sm ${cardIsColored ? 'text-white/60' : 'text-muted-foreground'}`}>
                <Clock className="h-3.5 w-3.5" />
                ~60 min
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold btn-press ${cardIsColored ? 'bg-black/25 text-white' : 'bg-primary text-primary-foreground'}`}>
                {todayWorkout?.completed ? '✅ Completed' : 'Start Workout'}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Nutrition Card ──────────────────────── */}
      <div
        className="rounded-2xl bg-card border border-border p-4 space-y-3 animate-slide-up animate-delay-300 card-hover cursor-pointer"
        onClick={() => navigate('/nutrition')}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Apple className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nutrition</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{Math.round(nutritionStats.calories)}</span>
            <span className="text-xs text-muted-foreground">/ {targetCalories} kcal</span>
          </div>
        </div>

        {/* Calorie master bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min(100, (nutritionStats.calories / targetCalories) * 100)}%` }}
          />
        </div>

        {/* Macro breakdown */}
        <div className="grid grid-cols-3 gap-3 pt-0.5">
          <MacroBar
            label="Protein"
            icon={<Beef className="h-3 w-3" />}
            value={Math.round(nutritionStats.protein)}
            target={targetProtein}
            barColor="bg-blue-500"
            iconColor="text-blue-400"
          />
          <MacroBar
            label="Carbs"
            icon={<Wheat className="h-3 w-3" />}
            value={Math.round(nutritionStats.carbs)}
            target={targetCarbs}
            barColor="bg-amber-500"
            iconColor="text-amber-400"
          />
          <MacroBar
            label="Fats"
            icon={<Droplets className="h-3 w-3" />}
            value={Math.round(nutritionStats.fats)}
            target={targetFats}
            barColor="bg-pink-500"
            iconColor="text-pink-400"
          />
        </div>
      </div>

      {/* ── This Week ───────────────────────────── */}
      <div className="animate-slide-up animate-delay-400">
        <p className="section-label">This Week</p>
        <div className="flex gap-1.5 mt-2">
          {dayLabels.map((label, i) => {
            const isActive = i === selectedDayIdx;
            const dayNum   = i + 1;
            const tmpl     = templates?.find(t => t.day_number === dayNum);
            const dotColor = tmpl ? DAY_TYPE_DOT[tmpl.day_type as WorkoutDayType] : 'bg-border';
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[13px] font-bold btn-press transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-primary-foreground/50' : dotColor}`} />
              </button>
            );
          })}
        </div>

        {selectedDayInfo && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {selectedTemplate?.day_type === 'rest' ? '😴 Rest Day' : selectedDayInfo.label}
            </p>
            {selectedDayInfo.muscles && selectedDayInfo.muscles.length > 0 && (
              <div className="flex gap-1.5">
                {selectedDayInfo.muscles.map(m => (
                  <span key={m} className="text-[11px] text-primary font-medium">{m}</span>
                )).reduce((acc: React.ReactNode[], curr, i) =>
                  i === 0 ? [curr] : [...acc, <span key={`d${i}`} className="text-muted-foreground text-[11px]">·</span>, curr],
                [])}
              </div>
            )}
          </div>
        )}
        {!selectedDayInfo && (
          <p className="text-sm text-muted-foreground mt-2">No workout planned</p>
        )}
      </div>

      {/* ── Quick Actions ───────────────────────── */}
      <div className="animate-slide-up animate-delay-500">
        <p className="section-label">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <QuickAction
            icon={<Dumbbell className="h-6 w-6" />}
            label="Log Workout"
            iconBg="bg-primary/15"
            iconColor="text-primary"
            onClick={() => navigate('/workouts')}
          />
          <QuickAction
            icon={<Apple className="h-6 w-6" />}
            label="Add Meal"
            iconBg="bg-emerald-500/15"
            iconColor="text-emerald-400"
            onClick={() => navigate('/nutrition')}
          />
          <QuickAction
            icon={<BarChart3 className="h-6 w-6" />}
            label="Progress"
            iconBg="bg-blue-500/15"
            iconColor="text-blue-400"
            onClick={() => navigate('/progress')}
          />
        </div>
      </div>

      {editTarget && (
        <TargetEditModal
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          label={editTarget.label}
          unit={editTarget.unit}
          currentValue={editTarget.value}
          fieldName={editTarget.field}
          step={editTarget.step}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
  icon, iconBg, value, label, delay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  delay: string;
}) {
  return (
    <div className={`rounded-2xl bg-card border border-border p-4 flex flex-col gap-2 card-hover animate-slide-up ${delay}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground stat-number leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MacroBar({
  label, icon, value, target, barColor, iconColor,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  target: number;
  barColor: string;
  iconColor: string;
}) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-1 ${iconColor}`}>
        {icon}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-foreground font-semibold leading-none">
        {value}<span className="text-muted-foreground font-normal">/{target}g</span>
      </p>
    </div>
  );
}

function QuickAction({
  icon, label, iconBg, iconColor, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-card border border-border p-5 card-hover w-full"
    >
      <div className={`flex items-center justify-center h-11 w-11 rounded-2xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
    </button>
  );
}
