import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Pill, Check, ChevronLeft, ChevronRight, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupplements, useCreateSupplement, useSupplementLogs, useToggleSupplementLog } from '@/hooks/use-fitness-data';
import { TIMING_INFO, type TimingType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';

const TIMING_OPTIONS: TimingType[] = ['AM', 'PM', 'pre_workout', 'post_workout', 'with_meal'];

const TIMELINE_SECTIONS = [
  { key: 'AM', label: '🌅 Morning', icon: '☀️' },
  { key: 'pre_workout', label: '⚡ During Workout', icon: '🏋️' },
  { key: 'post_workout', label: '💪 Post-Workout', icon: '🔄' },
  { key: 'with_meal', label: '🍽️ With Meal', icon: '🥗' },
  { key: 'PM', label: '🌙 Evening / Pre-Sleep', icon: '😴' },
  { key: 'anytime', label: '📋 Anytime', icon: '⏰' },
];

const DEFAULT_SUPPLEMENTS = [
  { name: 'Ashwagandha', purpose: 'Stress & cortisol management', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Opti-Men', purpose: 'Multivitamin', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Vitamin C 1000mg', purpose: 'Immune support', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Vitamin D3 4000IU', purpose: 'Bone & immune health', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Neurobion', purpose: 'B-vitamin complex', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Probiotic 60B', purpose: 'Gut health', timing: ['AM'] as TimingType[], notes: null },
  { name: 'Chlorella', purpose: 'Detox & nutrient density', timing: ['AM'] as TimingType[], notes: null },
  { name: 'EAA', purpose: 'Intra-workout amino acids', timing: ['pre_workout'] as TimingType[], notes: 'During workout' },
  { name: 'Creatine', purpose: 'Strength & recovery', timing: ['post_workout'] as TimingType[], notes: '5g post-workout' },
  { name: 'Digestive Enzymes', purpose: 'Digestion support', timing: ['with_meal'] as TimingType[], notes: 'With Meal 3' },
  { name: 'Omega-3', purpose: 'Anti-inflammatory', timing: ['with_meal'] as TimingType[], notes: 'With largest fat meal' },
  { name: 'Potassium Citrate', purpose: 'Electrolyte balance', timing: ['PM'] as TimingType[], notes: null },
  { name: 'Magnesium Glycinate', purpose: 'Sleep & recovery', timing: ['PM'] as TimingType[], notes: 'Pre-sleep' },
  { name: 'Metformin 500XR', purpose: 'Glucose management', timing: ['with_meal'] as TimingType[], notes: '⚠️ WITH MEALS ONLY - never fasted' },
];

export default function Supplements() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: supplements = [], isLoading: supplementsLoading } = useSupplements();
  const { data: supplementLogs = [], isLoading: logsLoading } = useSupplementLogs(dateStr);
  const createSupplement = useCreateSupplement();
  const toggleLog = useToggleSupplementLog();
  
  const [newName, setNewName] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newTiming, setNewTiming] = useState<TimingType[]>([]);
  const [newNotes, setNewNotes] = useState('');
  const [seeded, setSeeded] = useState(false);

  // Auto-seed default supplements if user has none
  const seedSupplements = async () => {
    if (seeded || supplements.length > 0 || supplementsLoading) return;
    setSeeded(true);
    for (const supp of DEFAULT_SUPPLEMENTS) {
      await createSupplement.mutateAsync({
        name: supp.name,
        purpose: supp.purpose,
        timing: supp.timing,
        notes: supp.notes,
        is_active: true,
      });
    }
  };

  // Trigger seed when supplements load as empty
  useMemo(() => {
    if (!supplementsLoading && supplements.length === 0 && !seeded && user) {
      seedSupplements();
    }
  }, [supplementsLoading, supplements.length, seeded, user]);

  // Fetch weekly logs for adherence/streak
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const { data: weeklyLogs = [] } = useQuery({
    queryKey: ['supplement-logs-weekly', user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('supplement_logs')
        .select('supplement_id, taken_date, taken')
        .eq('user_id', user.id)
        .gte('taken_date', sevenDaysAgo)
        .eq('taken', true);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  // Active supplements only
  const activeSupplements = useMemo(() => 
    supplements.filter(s => s.is_active),
    [supplements]
  );

  // Group supplements by timing
  const groupedByTiming = useMemo(() => {
    const groups: Record<string, typeof activeSupplements> = {};
    TIMELINE_SECTIONS.forEach(s => { groups[s.key] = []; });
    
    activeSupplements.forEach(supp => {
      if (!supp.timing || supp.timing.length === 0) {
        groups.anytime.push(supp);
      } else {
        const primaryTiming = supp.timing[0];
        if (groups[primaryTiming]) {
          groups[primaryTiming].push(supp);
        } else {
          groups.anytime.push(supp);
        }
      }
    });
    
    return groups;
  }, [activeSupplements]);

  // Weekly adherence per supplement
  const getWeeklyAdherence = (supplementId: string) => {
    const count = weeklyLogs.filter(l => l.supplement_id === supplementId).length;
    return Math.round((count / 7) * 100);
  };

  // Streak (consecutive days taken - simplified)
  const getStreak = (supplementId: string) => {
    return weeklyLogs.filter(l => l.supplement_id === supplementId).length;
  };

  // Get log status for each supplement
  const getLogStatus = (supplementId: string) => {
    const log = supplementLogs.find(l => l.supplement_id === supplementId);
    return log?.taken || false;
  };

  // Calculate adherence
  const takenCount = supplementLogs.filter(l => l.taken).length;
  const totalActive = activeSupplements.length;
  const adherencePercent = totalActive > 0 ? (takenCount / totalActive) * 100 : 0;

  const handleToggle = async (supplementId: string) => {
    const currentStatus = getLogStatus(supplementId);
    await toggleLog.mutateAsync({
      supplementId,
      date: dateStr,
      taken: !currentStatus,
    });
  };

  const handleCreateSupplement = async () => {
    if (!newName.trim()) return;
    await createSupplement.mutateAsync({
      name: newName,
      purpose: newPurpose || null,
      timing: newTiming.length > 0 ? newTiming : null,
      notes: newNotes || null,
      is_active: true,
    });
    setNewName('');
    setNewPurpose('');
    setNewTiming([]);
    setNewNotes('');
  };

  const toggleTiming = (timing: TimingType) => {
    setNewTiming(prev => 
      prev.includes(timing) 
        ? prev.filter(t => t !== timing)
        : [...prev, timing]
    );
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const isMetformin = (name: string) => name.toLowerCase().includes('metformin');

  if (supplementsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supplement Timeline</h1>
          <p className="text-muted-foreground mt-1">
            Daily checklist sorted by timing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Adherence Card */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {takenCount} / {totalActive}
                </div>
                <div className="text-sm text-muted-foreground">
                  supplements taken {isToday ? 'today' : 'that day'}
                </div>
              </div>
              {adherencePercent === 100 && (
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">All done!</span>
                </div>
              )}
            </div>
            <Progress value={adherencePercent} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-medium">Weekly Adherence</span>
            </div>
            <div className="text-2xl font-bold">
              {totalActive > 0 
                ? Math.round(weeklyLogs.length / (totalActive * 7) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-muted-foreground">
              {weeklyLogs.length} doses logged this week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Supplement Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplement
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Vitamin D3, Creatine, Fish Oil"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input
                placeholder="e.g., Muscle recovery, Energy, Sleep"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timing</Label>
              <div className="flex flex-wrap gap-2">
                {TIMING_OPTIONS.map(timing => (
                  <Badge
                    key={timing}
                    variant={newTiming.includes(timing) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTiming(timing)}
                  >
                    {TIMING_INFO[timing].time}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Dosage, brand, special instructions..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={handleCreateSupplement} disabled={!newName.trim()}>
                Add Supplement
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Sections */}
      {TIMELINE_SECTIONS.map(section => {
        const supps = groupedByTiming[section.key] || [];
        if (supps.length === 0) return null;
        
        return (
          <Card key={section.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{section.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supps.map(supp => {
                  const isTaken = getLogStatus(supp.id);
                  const adherence = getWeeklyAdherence(supp.id);
                  const streak = getStreak(supp.id);
                  const isMetforminItem = isMetformin(supp.name);
                  
                  return (
                    <div
                      key={supp.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isTaken ? 'bg-primary/10 border-primary/30' : 
                        isMetforminItem ? 'bg-red-500/5 border-red-500/30' : 'bg-card'
                      }`}
                    >
                      <Checkbox
                        checked={isTaken}
                        onCheckedChange={() => handleToggle(supp.id)}
                        className="h-6 w-6"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                            {supp.name}
                          </span>
                          {isMetforminItem && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              WITH MEALS ONLY - never fasted
                            </Badge>
                          )}
                        </div>
                        {supp.purpose && (
                          <div className="text-sm text-muted-foreground">
                            {supp.purpose}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span title="Weekly adherence">{adherence}%</span>
                        <span title="Streak">🔥 {streak}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {activeSupplements.length === 0 && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No supplements added</h3>
          <p className="text-muted-foreground">Add your first supplement to start tracking</p>
        </div>
      )}
    </div>
  );
}
