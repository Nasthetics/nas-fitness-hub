import { useState } from 'react';
import { format } from 'date-fns';
import { Droplets, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const QUICK_ADD = [250, 500, 750, 1000];
const GLASS_SIZE = 250;
const TOTAL_GLASSES = 16;

export function WaterTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: waterLogs = [] } = useQuery({
    queryKey: ['water-logs', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalMl = waterLogs.reduce((sum, l) => sum + (l.amount_ml || 0), 0);
  const targetMl = 4000;
  const percent = Math.min((totalMl / targetMl) * 100, 100);
  const glassCount = Math.floor(totalMl / GLASS_SIZE);

  const addWater = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('water_logs')
        .insert({ user_id: user.id, log_date: today, amount_ml: amount });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
    },
  });

  const removeWater = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const lastLog = waterLogs[waterLogs.length - 1];
      if (!lastLog) return;
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', lastLog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
    },
  });

  // SVG ring
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-400" />
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ring */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{totalMl}</span>
              <span className="text-xs text-muted-foreground">/ {targetMl}ml</span>
            </div>
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ADD.map(ml => (
            <Button
              key={ml}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => addWater.mutate(ml)}
              disabled={addWater.isPending}
            >
              <Plus className="h-3 w-3 mr-1" />
              {ml}ml
            </Button>
          ))}
        </div>

        {/* Undo */}
        {waterLogs.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => removeWater.mutate()}>
            <Minus className="h-3 w-3 mr-1" />
            Undo last
          </Button>
        )}

        {/* Glass visualization */}
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: TOTAL_GLASSES }).map((_, i) => (
            <div
              key={i}
              className={`h-6 rounded-sm transition-colors ${
                i < glassCount ? 'bg-blue-500' : 'bg-muted'
              }`}
              title={`Glass ${i + 1}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {glassCount} / {TOTAL_GLASSES} glasses ({GLASS_SIZE}ml each)
        </p>
      </CardContent>
    </Card>
  );
}
