-- Phase 1: Fix Anonymous Report Submissions and Function Security

-- 1. Add user_id column to galamsey_reports table
ALTER TABLE public.galamsey_reports 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update RLS policies for galamsey_reports
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.galamsey_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.galamsey_reports;

-- Create new secure RLS policies
CREATE POLICY "Authenticated users can insert their own reports" 
ON public.galamsey_reports 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" 
ON public.galamsey_reports 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own reports" 
ON public.galamsey_reports 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix database function security configurations
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;