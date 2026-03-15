import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Activity, Flame, Clock, Route, Heart, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_TYPES = [
  { value: 'run', label: '🏃 Run', met: 8.0 },
  { value: 'cycle', label: '🚴 Cycle', met: 6.0 },
  { value: 'swim', label: '🏊 Swim', met: 7.0 },
  { value: 'walk', label: '🚶 Walk', met: 3.5 },
  { value: 'hiit', label: '🔥 HIIT', met: 10.0 },
  { value: 'elliptical', label: '🏋️ Elliptical', met: 5.0 },
  { value: 'jump_rope', label: '⏩ Jump Rope', met: 12.0 },
  { value: 'other', label: '🏅 Other', met: 5.0 },
];

const WEIGHT_KG = 95;

export default function Cardio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [activityType, setActivityType] = useState('run');
  const [duration, setDuration] = useState('30');
  const [distance, setDistance] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [effort, setEffort] = useState([5]);
  const [notes, setNotes] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: allLogs = [] } = useQuery({
    queryKey: ['cardio-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cardio_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const weekLogs = useMemo(() => allLogs.filter(l => l.session_date >= weekStart && l.session_date <= weekEnd), [allLogs, weekStart, weekEnd]);

  const weeklyStats = useMemo(() => ({
    totalTime: weekLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0),
    totalCalories: weekLogs.reduce((s, l) => s + (l.calories_burned || 0), 0),
    sessions: weekLogs.length,
  }), [weekLogs]);

  const createLog = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const met = ACTIVITY_TYPES.find(a => a.value === activityType)?.met || 5;
      const durationHrs = parseInt(duration) / 60;
      const calories = Math.round(met * WEIGHT_KG * durationHrs);
      const { error } = await supabase.from('cardio_logs').insert({
        user_id: user.id,
        activity_type: activityType,
        duration_minutes: parseInt(duration),
        distance_km: distance ? parseFloat(distance) : null,
        avg_heart_rate: avgHr ? parseInt(avgHr) : null,
        perceived_effort: effort[0],
        calories_burned: calories,
        notes: notes || null,
        session_date: today,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardio-logs'] });
      setShowAdd(false);
      resetForm();
      toast({ title: 'Cardio session logged! 🏃' });
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cardio_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cardio-logs'] }),
  });

  const resetForm = () => {
    setActivityType('run');
    setDuration('30');
    setDistance('');
    setAvgHr('');
    setEffort([5]);
    setNotes('');
  };

  const selectedMet = ACTIVITY_TYPES.find(a => a.value === activityType)?.met || 5;
  const estCalories = Math.round(selectedMet * WEIGHT_KG * (parseInt(duration || '0') / 60));

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cardio</h1>
          <p className="text-muted-foreground">Track your cardio & cross-training</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Log Session
        </Button>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-info" />
            <div className="text-2xl font-bold">{weeklyStats.totalTime}m</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{weeklyStats.totalCalories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{weeklyStats.sessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">History</h2>
        {allLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No cardio sessions logged yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowAdd(true)}>
                Log Your First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          allLogs.map(log => {
            const actInfo = ACTIVITY_TYPES.find(a => a.value === log.activity_type);
            return (
              <Card key={log.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{actInfo?.label?.split(' ')[0]}</span>
                      <div>
                        <div className="font-medium">{actInfo?.label?.split(' ').slice(1).join(' ') || log.activity_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.session_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-medium">{log.duration_minutes}m</div>
                        {log.distance_km && <div className="text-xs text-muted-foreground">{log.distance_km}km</div>}
                      </div>
                      <Badge variant="secondary">{log.calories_burned} kcal</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLog.mutate(log.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Session Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Cardio Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Distance (km)</Label>
                <Input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avg Heart Rate (bpm)</Label>
              <Input type="number" value={avgHr} onChange={e => setAvgHr(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Perceived Effort: {effort[0]}/10</Label>
              <Slider value={effort} onValueChange={setEffort} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" rows={2} />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Estimated calories: </span>
              <span className="font-bold text-orange-500">{estCalories} kcal</span>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => createLog.mutate()} disabled={createLog.isPending || !duration}>
              Log Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
