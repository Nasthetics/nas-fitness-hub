import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { Dumbbell, Apple, BarChart3, ChevronRight, Clock, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useTodayWorkout, useWorkoutLogs, useMealLogs, useWorkoutTemplates,
  useSupplements, useSupplementLogs, useProfile
} from '@/hooks/use-fitness-data';
import { WORKOUT_DAY_INFO, type WorkoutDayType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DeloadBanner } from '@/components/workouts/DeloadBanner';
import { TargetEditModal } from '@/components/dashboard/TargetEditModal';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  const { data: todayWorkout } = useTodayWorkout();
  const { data: weeklyWorkouts } = useWorkoutLogs(weekStart, weekEnd);
  const { data: todayMeals } = useMealLogs(today);
  const { data: profile } = useProfile();
  const { data: templates } = useWorkoutTemplates();

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

  const isTrainingDay = todayWorkout?.template?.day_type !== 'rest';
  const targetCalories = isTrainingDay ? (profile?.training_day_calories || 2556) : (profile?.rest_day_calories || 2556);

  const nutritionStats = useMemo(() => {
    if (!todayMeals) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return todayMeals.reduce((acc, meal) => {
      meal.meal_items?.forEach(item => {
        acc.calories += Number(item.calories) || 0;
        acc.protein += Number(item.protein) || 0;
        acc.carbs += Number(item.carbs) || 0;
        acc.fats += Number(item.fats) || 0;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [todayMeals]);

  const weeklyCompletedCount = weeklyWorkouts?.filter(w => w.completed).length || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.display_name || 'Nas';
  const initials = displayName.charAt(0).toUpperCase();

  // Today's template
  const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayTemplate = templates?.find(t => t.day_number === todayDayNumber);
  const todayDayInfo = todayTemplate ? WORKOUT_DAY_INFO[todayTemplate.day_type as WorkoutDayType] : null;
  const isRestDay = todayTemplate?.day_type === 'rest';

  // Week day pills
  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);

  const selectedDayNumber = selectedDayIdx + 1;
  const selectedTemplate = templates?.find(t => t.day_number === selectedDayNumber);
  const selectedDayInfo = selectedTemplate ? WORKOUT_DAY_INFO[selectedTemplate.day_type as WorkoutDayType] : null;

  // Target edit
  const [editTarget, setEditTarget] = useState<any>(null);

  return (
    <div className="space-y-6 animate-in">
      {/* Header: greeting + avatar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-sm">
          {initials}
        </div>
      </div>

      {/* Deload Banner */}
      <DeloadBanner />

      {/* ── Stat chips ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up-far animate-delay-150">
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          iconBg="bg-orange-500/15"
          value={streak}
          label="Day Streak"
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4 text-blue-400" />}
          iconBg="bg-blue-500/15"
          value={weeklyCompletedCount}
          label="This Week"
        />
        <StatCard
          icon={<Zap className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/15"
          value={Math.round(nutritionStats.calories)}
          label="Kcal Today"
        />
      </div>

      {/* ── Today Workout Card ──────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer card-hover glow-primary-animated animate-slide-up-far animate-delay-250 shine-sweep"
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

      {/* TODAY WORKOUT CARD */}
      <div 
        className="rounded-2xl bg-primary text-primary-foreground p-5 cursor-pointer"
        onClick={() => navigate('/workouts')}
      >
        <p className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mb-1">Today</p>
        <h2 className="text-xl font-bold">
          {isRestDay ? '😴 Rest Day' : todayDayInfo?.label || 'No Plan Set'}
        </h2>
        {!isRestDay && todayDayInfo && (
          <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5" />
              {todayDayInfo.muscles?.length || 0} muscle groups
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              ~60 min
            </span>
          </div>
        )}
        {!isRestDay && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground text-primary px-4 py-2 text-sm font-bold">
              {todayWorkout?.completed ? '✅ Completed' : 'Start Workout'}
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        )}
      </div>

      {/* THIS WEEK - day pills */}
      <div>
        <p className="section-label">This Week</p>
        <div className="flex gap-2 mt-2">
          {dayLabels.map((label, i) => {
            const isActive = i === selectedDayIdx;
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex-1 h-10 rounded-full text-sm font-bold transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {selectedDayInfo && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedTemplate?.day_type === 'rest' ? '😴 Rest Day' : selectedDayInfo.label}
            {selectedDayInfo.muscles && selectedDayInfo.muscles.length > 0 && (
              <span className="ml-2 text-primary">
                {selectedDayInfo.muscles.join(' • ')}
              </span>
            )}
          </p>
        )}
        {!selectedDayInfo && (
          <p className="text-sm text-muted-foreground mt-2">No workout planned</p>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <p className="section-label">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <button
            onClick={() => navigate('/workouts')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border p-5 transition-colors hover:border-primary/40"
          >
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground">Log Workout</span>
          </button>
          <button
            onClick={() => navigate('/nutrition')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border p-5 transition-colors hover:border-primary/40"
          >
            <Apple className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground">Add Meal</span>
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card border border-border p-5 transition-colors hover:border-primary/40"
          >
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold text-foreground">Progress</span>
          </button>
        </div>
      </div>

      {/* Target Edit Modal */}
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
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
  icon, iconBg, value, label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
}) {
  const displayValue = useCountUp(value, 800);
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-2 card-hover">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground stat-number leading-none">{displayValue}</p>
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
