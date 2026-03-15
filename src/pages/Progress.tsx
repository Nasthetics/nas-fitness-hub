import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Scale, Ruler, Camera, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BulkQualityCard } from '@/components/progress/BulkQualityCard';
import { AnalyticsTab } from '@/components/progress/AnalyticsTab';
import { StrengthTab } from '@/components/progress/StrengthTab';
import { useBodyMetrics, useCreateBodyMetric } from '@/hooks/use-fitness-data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PRFeed() {
  const { user } = useAuth();
  const { data: prs = [] } = useQuery({
    queryKey: ['pr-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pr_history')
        .select('*, exercise:exercise_library(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
  });

  if (prs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          PR History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prs.map((pr: any) => (
            <div key={pr.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
              <div>
                <span className="font-medium">{pr.exercise?.name || 'Exercise'}</span>
                <Badge variant="outline" className="ml-2 text-xs">{pr.pr_type.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {pr.previous_weight_kg && (
                  <span className="text-muted-foreground line-through">
                    {pr.previous_weight_kg}kg × {pr.previous_reps}
                  </span>
                )}
                <span className="font-bold text-primary">{pr.weight_kg}kg × {pr.reps}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(pr.recorded_date), 'MMM d')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const { data: metrics = [], isLoading } = useBodyMetrics(90);
  const createMetric = useCreateBodyMetric();
  
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newArms, setNewArms] = useState('');
  const [newLegs, setNewLegs] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newWhoopRecovery, setNewWhoopRecovery] = useState('');
  const [newWhoopSleep, setNewWhoopSleep] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLogMetricsSheetOpen, setIsLogMetricsSheetOpen] = useState(false);

  // Calculate trends
  const latestMetric = metrics[0];
  const previousMetric = metrics[1];
  
  const weightTrend = useMemo(() => {
    if (!latestMetric?.weight_kg || !previousMetric?.weight_kg) return null;
    const diff = latestMetric.weight_kg - previousMetric.weight_kg;
    return { value: diff, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same' };
  }, [latestMetric, previousMetric]);

  // Chart data
  const weightChartData = useMemo(() => {
    return metrics
      .filter(m => m.weight_kg)
      .map(m => ({
        date: format(new Date(m.recorded_date), 'MMM d'),
        weight: m.weight_kg,
      }))
      .reverse();
  }, [metrics]);

  const measurementChartData = useMemo(() => {
    return metrics
      .filter(m => m.waist_cm || m.chest_cm || m.arms_cm)
      .map(m => ({
        date: format(new Date(m.recorded_date), 'MMM d'),
        waist: m.waist_cm,
        chest: m.chest_cm,
        arms: m.arms_cm,
        legs: m.legs_cm,
      }))
      .reverse();
  }, [metrics]);

  const handleCreateMetric = async () => {
    await createMetric.mutateAsync({
      recorded_date: format(new Date(), 'yyyy-MM-dd'),
      weight_kg: newWeight ? parseFloat(newWeight) : null,
      body_fat_percent: newBodyFat ? parseFloat(newBodyFat) : null,
      waist_cm: newWaist ? parseFloat(newWaist) : null,
      chest_cm: newChest ? parseFloat(newChest) : null,
      arms_cm: newArms ? parseFloat(newArms) : null,
      legs_cm: newLegs ? parseFloat(newLegs) : null,
      inbody_score: null,
      whoop_recovery: newWhoopRecovery ? parseInt(newWhoopRecovery) : null,
      whoop_sleep_hours: newWhoopSleep ? parseFloat(newWhoopSleep) : null,
      notes: newNotes || null,
    });
    
    // Reset form
    setNewWeight('');
    setNewBodyFat('');
    setNewWaist('');
    setNewChest('');
    setNewArms('');
    setNewLegs('');
    setNewNotes('');
    setNewWhoopRecovery('');
    setNewWhoopSleep('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !user) return;
    
    setUploading(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, photoFile);
      
      if (uploadError) throw uploadError;
      
      // Save reference in database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          storage_path: filePath,
          recorded_date: format(new Date(), 'yyyy-MM-dd'),
        });
      
      if (dbError) throw dbError;
      
      setPhotoFile(null);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Body Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Track your weight, measurements, and progress photos
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Metrics
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log Body Metrics</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="85.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Fat %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Waist (cm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="82"
                    value={newWaist}
                    onChange={(e) => setNewWaist(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chest (cm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="105"
                    value={newChest}
                    onChange={(e) => setNewChest(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arms (cm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="40"
                    value={newArms}
                    onChange={(e) => setNewArms(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legs (cm)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="62"
                    value={newLegs}
                    onChange={(e) => setNewLegs(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WHOOP Recovery %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={newWhoopRecovery}
                    onChange={(e) => setNewWhoopRecovery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WHOOP Sleep (hrs)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="7.5"
                    value={newWhoopSleep}
                    onChange={(e) => setNewWhoopSleep(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="How do you feel? Any observations?"
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
                <Button onClick={handleCreateMetric}>
                  Save Metrics
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Weight</span>
            </div>
            <div className="text-2xl font-bold">
              {latestMetric?.weight_kg ? `${latestMetric.weight_kg} kg` : '—'}
            </div>
            {weightTrend && (
              <div className={`flex items-center gap-1 text-sm ${
                weightTrend.direction === 'up' ? 'text-red-500' : 
                weightTrend.direction === 'down' ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {weightTrend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                 weightTrend.direction === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                {weightTrend.value > 0 ? '+' : ''}{weightTrend.value.toFixed(1)} kg
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Waist</span>
            </div>
            <div className="text-2xl font-bold">
              {latestMetric?.waist_cm ? `${latestMetric.waist_cm} cm` : '—'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Arms</span>
            </div>
            <div className="text-2xl font-bold">
              {latestMetric?.arms_cm ? `${latestMetric.arms_cm} cm` : '—'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Body Fat</span>
            </div>
            <div className="text-2xl font-bold">
              {latestMetric?.body_fat_percent ? `${latestMetric.body_fat_percent}%` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Quality Score */}
      <BulkQualityCard />

      {/* PR Feed */}
      <PRFeed />

      {/* Charts */}
      <Tabs defaultValue="weight" className="space-y-4">
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <TabsList className="flex-nowrap w-max">
            <TabsTrigger value="weight">Weight Trend</TabsTrigger>
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="photos">Progress Photos</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle>Weight Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {weightChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={['dataMin - 2', 'dataMax + 2']}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No weight data yet. Log your first weigh-in!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="measurements">
          <Card>
            <CardHeader>
              <CardTitle>Measurements Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {measurementChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={measurementChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="waist" stroke="#ef4444" strokeWidth={2} name="Waist" />
                    <Line type="monotone" dataKey="chest" stroke="#3b82f6" strokeWidth={2} name="Chest" />
                    <Line type="monotone" dataKey="arms" stroke="#22c55e" strokeWidth={2} name="Arms" />
                    <Line type="monotone" dataKey="legs" stroke="#f59e0b" strokeWidth={2} name="Legs" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No measurement data yet. Log your first measurements!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strength">
          <StrengthTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Progress Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handlePhotoUpload}
                    disabled={!photoFile || uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center h-[200px] border-2 border-dashed rounded-lg text-muted-foreground">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload progress photos to track your transformation</p>
                    <p className="text-sm">Photos are stored securely and only visible to you</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 10).map(metric => (
              <div 
                key={metric.id}
                className="flex items-center justify-between py-3 px-4 bg-accent/30 rounded-lg"
              >
                <div className="font-medium">
                  {format(new Date(metric.recorded_date), 'EEE, MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {metric.weight_kg && <span>{metric.weight_kg} kg</span>}
                  {metric.waist_cm && <span>Waist: {metric.waist_cm} cm</span>}
                  {metric.body_fat_percent && <span>BF: {metric.body_fat_percent}%</span>}
                  {metric.whoop_recovery && <span>Recovery: {metric.whoop_recovery}%</span>}
                </div>
              </div>
            ))}
            
            {metrics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No metrics logged yet. Start tracking your progress!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
