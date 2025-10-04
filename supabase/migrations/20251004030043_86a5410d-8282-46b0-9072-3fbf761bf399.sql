-- Block all anonymous access to galamsey_reports table
-- This prevents unauthenticated users from reading sensitive report data including GPS locations

CREATE POLICY "Block all anonymous access to reports"
ON public.galamsey_reports
FOR ALL
TO anon
USING (false);