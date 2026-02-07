import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Pill, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

const TIMING_OPTIONS: TimingType[] = ['AM', 'PM', 'pre_workout', 'post_workout', 'with_meal'];

export default function Supplements() {
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

  // Active supplements only
  const activeSupplements = useMemo(() => 
    supplements.filter(s => s.is_active),
    [supplements]
  );

  // Group supplements by timing - must be before any conditional returns
  const groupedByTiming = useMemo(() => {
    const groups: Record<string, typeof activeSupplements> = {
      'AM': [],
      'pre_workout': [],
      'with_meal': [],
      'post_workout': [],
      'PM': [],
      'anytime': [],
    };
    
    activeSupplements.forEach(supp => {
      if (!supp.timing || supp.timing.length === 0) {
        groups.anytime.push(supp);
      } else {
        // Add to first timing group
        const primaryTiming = supp.timing[0];
        if (groups[primaryTiming]) {
          groups[primaryTiming].push(supp);
        }
      }
    });
    
    return groups;
  }, [activeSupplements]);

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
          <h1 className="text-3xl font-bold text-foreground">Supplements</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily supplement intake
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

      {/* Supplements by Timing */}
      {Object.entries(groupedByTiming).map(([timing, supps]) => {
        if (supps.length === 0) return null;
        
        const timingLabel = timing === 'anytime' ? 'Anytime' : TIMING_INFO[timing as TimingType]?.time || timing;
        
        return (
          <Card key={timing}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{timingLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supps.map(supp => {
                  const isTaken = getLogStatus(supp.id);
                  
                  return (
                    <div
                      key={supp.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isTaken ? 'bg-primary/10 border-primary/30' : 'bg-card'
                      }`}
                    >
                      <Checkbox
                        checked={isTaken}
                        onCheckedChange={() => handleToggle(supp.id)}
                        className="h-6 w-6"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                          {supp.name}
                        </div>
                        {supp.purpose && (
                          <div className="text-sm text-muted-foreground">
                            {supp.purpose}
                          </div>
                        )}
                      </div>
                      {supp.timing && supp.timing.length > 1 && (
                        <div className="flex gap-1">
                          {supp.timing.map(t => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {TIMING_INFO[t]?.time}
                            </Badge>
                          ))}
                        </div>
                      )}
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
