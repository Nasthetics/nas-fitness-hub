import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Droplets, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useProfile, useUpdateProfile } from '@/hooks/use-fitness-data';
import { useToast } from '@/hooks/use-toast';

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

  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [targetGain, setTargetGain] = useState('');
  const [waterTarget, setWaterTarget] = useState('');
  const [trainingCal, setTrainingCal] = useState('');
  const [trainingP, setTrainingP] = useState('');
  const [trainingC, setTrainingC] = useState('');
  const [trainingF, setTrainingF] = useState('');
  const [ramadanMode, setRamadanMode] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeightCm(profile.height_cm?.toString() || '');
      setBodyFat(profile.body_fat_percent?.toString() || '');
      setLeanMass(profile.lean_mass_kg?.toString() || '');
      setTargetGain(profile.target_weight_gain_per_week?.toString() || '0.3');
      setWaterTarget(profile.water_target_ml?.toString() || '4000');
      setTrainingCal(profile.training_day_calories?.toString() || '2556');
      setTrainingP(profile.training_day_protein?.toString() || '246');
      setTrainingC(profile.training_day_carbs?.toString() || '189');
      setTrainingF(profile.training_day_fats?.toString() || '91');
      setRamadanMode(profile.ramadan_mode || false);
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
      lean_mass_kg: leanMass ? parseFloat(leanMass) : null,
      target_weight_gain_per_week: targetGain ? parseFloat(targetGain) : 0.3,
      water_target_ml: waterTarget ? parseInt(waterTarget) : 4000,
      training_day_calories: trainingCal ? parseInt(trainingCal) : 2556,
      training_day_protein: trainingP ? parseInt(trainingP) : 246,
      training_day_carbs: trainingC ? parseInt(trainingC) : 189,
      training_day_fats: trainingF ? parseInt(trainingF) : 91,
      ramadan_mode: ramadanMode,
    } as any);
    toast({ title: 'Settings saved! ✅' });
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Profile & preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nas" />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="190" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Body Fat %</Label>
              <Input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="14" />
            </div>
            <div className="space-y-2">
              <Label>Lean Mass (kg)</Label>
              <Input type="number" value={leanMass} onChange={e => setLeanMass(e.target.value)} placeholder="81.7" />
            </div>
            <div className="space-y-2">
              <Label>Target Gain (kg/wk)</Label>
              <Input type="number" step="0.1" value={targetGain} onChange={e => setTargetGain(e.target.value)} placeholder="0.3" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Droplets className="h-4 w-4" /> Daily Water Target (ml)</Label>
            <Input type="number" value={waterTarget} onChange={e => setWaterTarget(e.target.value)} placeholder="4000" />
          </div>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card>
        <CardHeader>
          <CardTitle>Training Day Macros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input type="number" value={trainingCal} onChange={e => setTrainingCal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Protein (g)</Label>
              <Input type="number" value={trainingP} onChange={e => setTrainingP(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Carbs (g)</Label>
              <Input type="number" value={trainingC} onChange={e => setTrainingC(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fats (g)</Label>
              <Input type="number" value={trainingF} onChange={e => setTrainingF(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ramadan Mode */}
      <Card className={ramadanMode ? 'border-primary/50 ring-1 ring-primary/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" /> Ramadan Mode
            </CardTitle>
            <Switch checked={ramadanMode} onCheckedChange={setRamadanMode} />
          </div>
        </CardHeader>
        {ramadanMode && (
          <CardContent className="space-y-6">
            {/* Prayer Times */}
            <div>
              <h3 className="font-medium mb-3">Dubai Prayer Times</h3>
              <div className="grid grid-cols-3 gap-2">
                {DUBAI_PRAYER_TIMES.map(p => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm text-muted-foreground">{p.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplement Shifts */}
            <div>
              <h3 className="font-medium mb-3">Supplement Timing Shifts</h3>
              <div className="space-y-2">
                {RAMADAN_SUPPLEMENT_SHIFTS.map(s => (
                  <div key={s.supplement} className={`flex items-center justify-between p-3 rounded-lg ${s.warning ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/50'}`}>
                    <span className="text-sm font-medium">{s.supplement}</span>
                    <div className="flex items-center gap-2">
                      {s.warning && <Badge variant="destructive" className="text-xs">⚠️ WITH MEALS ONLY</Badge>}
                      <span className="text-sm text-muted-foreground">{s.timing}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout Options */}
            <div>
              <h3 className="font-medium mb-3">Workout Timing Options</h3>
              <div className="space-y-2">
                {RAMADAN_WORKOUT_OPTIONS.map(o => (
                  <div key={o.label} className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-sm">{o.label}</div>
                    <div className="text-xs text-muted-foreground">{o.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hydration */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-blue-400">Compressed Hydration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                4L between Iftar (18:15) and Suhoor (~04:30). That's ~400ml every hour.
                Set reminders every 60 minutes during this window.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full" size="lg">
        Save Settings
      </Button>
    </div>
  );
}
