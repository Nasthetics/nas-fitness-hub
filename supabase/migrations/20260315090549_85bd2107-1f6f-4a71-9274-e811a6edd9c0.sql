ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS superset_group_id uuid DEFAULT NULL;
ALTER TABLE public.set_logs ADD COLUMN IF NOT EXISTS is_dropset boolean DEFAULT false;