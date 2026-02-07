-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to exercise images
CREATE POLICY "Public read access for exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');

-- Allow authenticated users to upload exercise images (for edge function)
CREATE POLICY "Service role can upload exercise images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-images');

-- Allow updates to exercise images
CREATE POLICY "Service role can update exercise images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exercise-images');

-- Add image_url column to exercise_library to cache generated images
ALTER TABLE public.exercise_library
ADD COLUMN IF NOT EXISTS image_url TEXT;