-- Add new columns for GPS lat/long and AI fields
ALTER TABLE public.galamsey_reports 
ADD COLUMN IF NOT EXISTS gps_lat numeric,
ADD COLUMN IF NOT EXISTS gps_long numeric,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS ai_category text;

-- Drop the old gps_coordinates column if it exists (data migration)
-- First migrate any existing data
UPDATE public.galamsey_reports 
SET gps_lat = (gps_coordinates->>'lat')::numeric,
    gps_long = (gps_coordinates->>'lng')::numeric
WHERE gps_coordinates IS NOT NULL;

-- Make user_id nullable for public submissions
ALTER TABLE public.galamsey_reports ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Users can view their own reports" ON public.galamsey_reports;
DROP POLICY IF EXISTS "Authenticated users can insert their own reports" ON public.galamsey_reports;

-- Create policy for public (anonymous) inserts
CREATE POLICY "Anyone can insert reports" 
ON public.galamsey_reports 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Keep admin policies for viewing/managing
-- Admins can view all reports (already exists)
-- Admins can update reports (already exists)
-- Admins can delete reports (already exists)