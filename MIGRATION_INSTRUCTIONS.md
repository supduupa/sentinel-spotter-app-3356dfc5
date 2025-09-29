# Schema Migration Instructions

## Steps to Migrate to New Supabase Project

### 1. Create New Supabase Project
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Name it "reportApp" (or your preferred name)
5. Generate a strong password
6. Wait for project to be ready

### 2. Run Schema Migration
1. Open the new project's SQL Editor
2. Copy the entire content from `migration-script.sql`
3. Paste and execute it in the SQL Editor
4. This will create all tables, functions, policies, and triggers

### 3. Export Data from Old Project (Optional)
If you want to keep your existing data:
1. Try to access your old project at: https://supabase.com/dashboard/project/szisowtjjhcssdzrxnse
2. If you can access it, go to SQL Editor
3. Run each query from `data-export-script.sql` one by one
4. Copy the results (INSERT statements)
5. Run these INSERT statements in your new project's SQL Editor

### 4. Update App Configuration
After creating the new project:
1. Get your new project's URL and anon key from Project Settings > API
2. I'll update the app configuration to use the new project

### 5. Test Everything
1. Test authentication (sign up/sign in)
2. Test report creation
3. Test admin functionality
4. Verify all data appears correctly

## What Gets Migrated
✅ All tables (profiles, user_roles, galamsey_reports)  
✅ All functions (has_role, is_admin, handle_new_user, etc.)  
✅ All RLS policies  
✅ All triggers  
✅ Custom types (app_role enum)  
✅ Realtime configuration  

## Notes
- The migration script recreates the exact same structure
- Data migration is optional but recommended if you want to keep existing data
- After migration, you'll need new project credentials
- All existing user accounts will need to be recreated (unless you migrate auth data too)