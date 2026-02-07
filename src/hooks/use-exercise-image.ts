import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EquipmentType } from '@/lib/types';

interface UseExerciseImageOptions {
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType;
  primaryMuscle?: string | null;
  existingImageUrl?: string | null;
  autoGenerate?: boolean;
}

interface UseExerciseImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

export function useExerciseImage({
  exerciseId,
  exerciseName,
  equipment,
  primaryMuscle,
  existingImageUrl,
  autoGenerate = false,
}: UseExerciseImageOptions): UseExerciseImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update if existing URL changes
  useEffect(() => {
    if (existingImageUrl) {
      setImageUrl(existingImageUrl);
    }
  }, [existingImageUrl]);

  const generate = async () => {
    if (imageUrl || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-exercise-image', {
        body: {
          exerciseId,
          exerciseName,
          equipment,
          primaryMuscle,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error generating exercise image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount if enabled and no existing image
  useEffect(() => {
    if (autoGenerate && !existingImageUrl && !imageUrl && !isGenerating) {
      generate();
    }
  }, [autoGenerate, existingImageUrl]);

  return {
    imageUrl,
    isLoading,
    isGenerating,
    error,
    generate,
  };
}
