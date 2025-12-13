-- Add a base policy requiring authentication to access profiles
CREATE POLICY "Require authentication to access profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate as permissive policies (default behavior)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));