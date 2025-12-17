-- Drop the overpermissive policy that allows any authenticated user to read all profiles
DROP POLICY IF EXISTS "Require authentication to access profiles" ON public.profiles;