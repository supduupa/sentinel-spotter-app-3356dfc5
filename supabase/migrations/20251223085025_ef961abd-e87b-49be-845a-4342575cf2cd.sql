-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.galamsey_reports;

-- Create a PERMISSIVE INSERT policy that allows authenticated users to insert
CREATE POLICY "Authenticated users can insert reports"
ON public.galamsey_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add a SELECT policy so users can see their own reports after insertion
CREATE POLICY "Users can view their own reports"
ON public.galamsey_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);