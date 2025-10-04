-- Tighten RLS by scoping access to authenticated role and removing redundant anon policy

-- 1) galamsey_reports: remove anon policy and scope all access to authenticated users only
DROP POLICY IF EXISTS "Block all anonymous access to reports" ON public.galamsey_reports;

DROP POLICY IF EXISTS "Users can view their own reports" ON public.galamsey_reports;
CREATE POLICY "Users can view their own reports"
ON public.galamsey_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.galamsey_reports;
CREATE POLICY "Admins can view all reports"
ON public.galamsey_reports
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert their own reports" ON public.galamsey_reports;
CREATE POLICY "Authenticated users can insert their own reports"
ON public.galamsey_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update reports" ON public.galamsey_reports;
CREATE POLICY "Admins can update reports"
ON public.galamsey_reports
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.galamsey_reports;
CREATE POLICY "Admins can delete reports"
ON public.galamsey_reports
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- 2) profiles: restrict to authenticated users as well
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 3) user_roles: explicitly scope to authenticated and include WITH CHECK for write operations
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));