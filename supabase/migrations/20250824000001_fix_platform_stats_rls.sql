-- Fix RLS performance issues for platform_stats table
-- Addresses Supabase linter warnings: auth_rls_initplan and multiple_permissive_policies

-- Drop existing policies to recreate them with optimizations
DROP POLICY IF EXISTS "Allow public read access to platform stats" ON "public"."platform_stats";
DROP POLICY IF EXISTS "Allow service role to update platform stats" ON "public"."platform_stats";

-- Create optimized policies

-- Public read access policy (SELECT only)
CREATE POLICY "Allow public read access to platform stats" 
ON "public"."platform_stats" 
FOR SELECT 
USING (true);

-- Service role policy with optimized auth check (ALL operations)
-- Fix auth RLS initplan by using subquery: (select auth.role())
CREATE POLICY "Allow service role full access to platform stats" 
ON "public"."platform_stats" 
USING ((select auth.role()) = 'service_role'::text);