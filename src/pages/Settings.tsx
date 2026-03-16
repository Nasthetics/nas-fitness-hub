import { useState, useEffect } from 'react';
import { Moon, Droplets, User, Bot, CheckCircle2, AlertCircle, Target, Dumbbell, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useProfile, useUpdateProfile } from '@/hooks/use-fitness-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const DUBAI_PRAYER_TIMES = [
  { name: 'Fajr', time: '05:10' },
  { name: 'Sunrise', time: '06:25' },
  { name: 'Dhuhr', time: '12:20' },
  { name: 'Asr', time: '15:35' },
  { name: 'Maghrib / Iftar', time: '18:15' },
  { name: 'Isha', time: '19:35' },
];

const RAMADAN_SUPPLEMENT_SHIFTS = [
  { supplement: 'Metformin 500XR', timing: 'With Iftar & Suhoor meals only', warning: true },
  { supplement: 'Magnesium Glycinate', timing: 'Suhoor (before sleep)', warning: false },
  { supplement: 'Creatine', timing: 'Post-Iftar', warning: false },
  { supplement: 'All Morning Supplements', timing: 'Moved to Iftar window', warning: false },
];

const RAMADAN_WORKOUT_OPTIONS = [
  { label: 'Pre-Iftar (Light)', desc: '30-45 min before Iftar. Low intensity, reduced volume.' },
  { label: 'Post-Iftar (Performance)', desc: '1.5-2 hours after Iftar. Full intensity session.' },
  { label: 'Post-Tarawih', desc: 'Late night session. Full or moderate intensity.' },
];

export default function Settings() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [targetGain, setTargetGain] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [ramadanMode, setRamadanMode] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState(() => localStorage.getItem('claude_api_key') || '');

  const [trainingCal, setTrainingCal] = useState('2556');
  const [trainingP, setTrainingP] = useState('245');
  const [trainingC, setTrainingC] = useState('189');
  const [trainingF, setTrainingF] = useState('91');
  const [waterTarget, setWaterTarget] = useState('4000');
  const [weeklyWorkoutTarget, setWeeklyWorkoutTarget] = useState('5');

  const [restDayDifferent, setRestDayDifferent] = useState(true);
  const [restCal, setRestCal] = useState('2256');
  const [restP, setRestP] = useState('245');
  const [restC, setRestC] = useState('159');
  const [restF, setRestF] = useState('91');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCurrentWeight('95');
      setHeightCm(profile.height_cm?.toString() || '');
      setBodyFat(profile.body_fat_percent?.toString() || '');
      setLeanMass(profile.lean_mass_kg?.toString() || '');
      setTargetGain(profile.target_weight_gain_per_week?.toString() || '0.3');
      setWaterTarget(profile.water_target_ml?.toString() || '4000');
      setTrainingCal(profile.training_day_calories?.toString() || '2556');
      setTrainingP(profile.training_day_protein?.toString() || '245');
      setTrainingC(profile.training_day_carbs?.toString() || '189');
      setTrainingF(profile.training_day_fats?.toString() || '91');
      setWeeklyWorkoutTarget((profile.weekly_workout_target ?? 5).toString());
      setRestDayDifferent(profile.rest_day_different_targets ?? true);
      setRestCal(profile.rest_day_calories?.toString() || '2256');
      setRestP(profile.rest_day_protein?.toString() || '245');
      setRestC(profile.rest_day_carbs?.toString() || '159');
      setRestF(profile.rest_day_fats?.toString() || '91');
      setRamadanMode(profile.ramadan_mode || false);
    }
  }, [profile]);

  const handleSave = async () => {
    const restCalVal = restDayDifferent ? parseInt(restCal) : (parseInt(trainingCal) - 300);
    const restCVal = restDayDifferent ? parseInt(restC) : (parseInt(trainingC) - 30);
    
    await updateProfile.mutateAsync({
      display_name: displayName || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
      lean_mass_kg: leanMass ? parseFloat(leanMass) : null,
      target_weight_gain_per_week: targetGain ? parseFloat(targetGain) : 0.3,
      water_target_ml: waterTarget ? parseInt(waterTarget) : 4000,
      training_day_calories: trainingCal ? parseInt(trainingCal) : 2556,
      training_day_protein: trainingP ? parseInt(trainingP) : 245,
      training_day_carbs: trainingC ? parseInt(trainingC) : 189,
      training_day_fats: trainingF ? parseInt(trainingF) : 91,
      rest_day_calories: restCalVal || 2256,
      rest_day_protein: restDayDifferent ? parseInt(restP) : parseInt(trainingP),
      rest_day_carbs: restCVal || 159,
      rest_day_fats: restDayDifferent ? parseInt(restF) : parseInt(trainingF),
      weekly_workout_target: parseInt(weeklyWorkoutTarget) || 5,
      rest_day_different_targets: restDayDifferent,
      ramadan_mode: ramadanMode,
    } as any);
    
    localStorage.setItem('targets_backup', JSON.stringify({
      training_day_calories: parseInt(trainingCal),
      training_day_protein: parseInt(trainingP),
      training_day_carbs: parseInt(trainingC),
      training_day_fats: parseInt(trainingF),
      water_target_ml: parseInt(waterTarget),
      weekly_workout_target: parseInt(weeklyWorkoutTarget),
    }));
    
    toast({ title: 'Settings saved ✅' });
  };

  const initials = (displayName || 'N').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-in">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-4">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-foreground">
          {initials}
        </div>
        <h2 className="text-xl font-bold text-foreground mt-3">{displayName || 'User'}</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      {/* Profile Section */}
      <div>
        <p className="section-label">Profile</p>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nas" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg)</Label>
              <Input type="number" step="0.1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Height (cm)</Label>
              <Input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Body Fat %</Label>
              <Input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Lean Mass (kg)</Label>
              <Input type="number" value={leanMass} onChange={e => setLeanMass(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Gain (kg/wk)</Label>
              <Input type="number" step="0.1" value={targetGain} onChange={e => setTargetGain(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Targets */}
      <div>
        <p className="section-label">Daily Targets</p>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4 mt-2">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <Dumbbell className="h-3 w-3" /> {restDayDifferent ? 'Training Day' : 'Daily'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1"><Label className="text-[10px]">Cal</Label><Input type="number" value={trainingCal} onChange={e => setTrainingCal(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-[10px]">Protein</Label><Input type="number" value={trainingP} onChange={e => setTrainingP(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-[10px]">Carbs</Label><Input type="number" value={trainingC} onChange={e => setTrainingC(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-[10px]">Fats</Label><Input type="number" value={trainingF} onChange={e => setTrainingF(e.target.value)} /></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Label className="text-xs">Rest day targets</Label>
            <Switch checked={restDayDifferent} onCheckedChange={setRestDayDifferent} />
          </div>

          {restDayDifferent && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">😴 Rest Day</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1"><Label className="text-[10px]">Cal</Label><Input type="number" value={restCal} onChange={e => setRestCal(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px]">Protein</Label><Input type="number" value={restP} onChange={e => setRestP(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px]">Carbs</Label><Input type="number" value={restC} onChange={e => setRestC(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[10px]">Fats</Label><Input type="number" value={restF} onChange={e => setRestF(e.target.value)} /></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Droplets className="h-3 w-3" /> Water (ml)</Label>
              <Input type="number" step="250" value={waterTarget} onChange={e => setWaterTarget(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Dumbbell className="h-3 w-3" /> Weekly Days</Label>
              <Input type="number" min="1" max="7" value={weeklyWorkoutTarget} onChange={e => setWeeklyWorkoutTarget(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Ramadan Mode */}
      <div>
        <p className="section-label">Ramadan Mode</p>
        <div className={`rounded-2xl bg-card border ${ramadanMode ? 'border-primary/50' : 'border-border'} p-4 mt-2`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold flex items-center gap-2"><Moon className="h-4 w-4" /> Ramadan Mode</span>
            <Switch checked={ramadanMode} onCheckedChange={setRamadanMode} />
          </div>
          {ramadanMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {DUBAI_PRAYER_TIMES.map(p => (
                  <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary text-xs">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.time}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {RAMADAN_SUPPLEMENT_SHIFTS.map(s => (
                  <div key={s.supplement} className={`flex items-center justify-between p-2 rounded-lg text-xs ${s.warning ? 'bg-destructive/10 border border-destructive/30' : 'bg-secondary'}`}>
                    <span className="font-medium">{s.supplement}</span>
                    <span className="text-muted-foreground">{s.timing}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Coach */}
      <div>
        <p className="section-label">AI Coach</p>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-xs">Claude API Key</Label>
            <Input type="password" value={claudeApiKey} onChange={e => setClaudeApiKey(e.target.value)} placeholder="sk-ant-..." />
          </div>
          <div className="flex items-center gap-2">
            {claudeApiKey ? (
              <><CheckCircle2 className="h-3 w-3 text-primary" /><span className="text-xs text-primary font-medium">Connected</span></>
            ) : (
              <><AlertCircle className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Not configured</span></>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            localStorage.setItem('claude_api_key', claudeApiKey);
            toast({ title: 'API key saved ✅' });
          }} disabled={!claudeApiKey}>
            Save Key
          </Button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full rounded-xl" size="lg">
        Save Settings
      </Button>

      <Button variant="outline" onClick={signOut} className="w-full rounded-xl text-destructive border-destructive/30">
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
