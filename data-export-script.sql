-- Data Export Script
-- Run these queries in your OLD Supabase project SQL Editor to export data

-- 1. Export profiles data
SELECT 
    'INSERT INTO public.profiles (id, user_id, created_at, updated_at, email, full_name) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(created_at::text) || '::timestamptz, ' ||
    quote_literal(updated_at::text) || '::timestamptz, ' ||
    COALESCE(quote_literal(email), 'NULL') || ', ' ||
    COALESCE(quote_literal(full_name), 'NULL') || ');'
FROM public.profiles;

-- 2. Export user_roles data
SELECT 
    'INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(user_id::text) || '::uuid, ' ||
    quote_literal(role::text) || '::app_role, ' ||
    quote_literal(created_at::text) || '::timestamptz);'
FROM public.user_roles;

-- 3. Export galamsey_reports data
SELECT 
    'INSERT INTO public.galamsey_reports (id, date, updated_at, user_id, gps_coordinates, created_at, location, description, gps_address, photos) VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(date::text) || '::date, ' ||
    quote_literal(updated_at::text) || '::timestamptz, ' ||
    COALESCE(quote_literal(user_id::text) || '::uuid', 'NULL') || ', ' ||
    COALESCE(quote_literal(gps_coordinates::text) || '::jsonb', 'NULL') || ', ' ||
    quote_literal(created_at::text) || '::timestamptz, ' ||
    quote_literal(location) || ', ' ||
    quote_literal(description) || ', ' ||
    COALESCE(quote_literal(gps_address), 'NULL') || ', ' ||
    COALESCE(quote_literal(photos::text) || '::text[]', 'NULL') || ');'
FROM public.galamsey_reports;