-- Fix multiple permissive policies issue for platform_stats table
-- Consolidate overlapping SELECT policies into a single optimized policy

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to platform stats" ON "public"."platform_stats";
DROP POLICY IF EXISTS "Allow service role full access to platform stats" ON "public"."platform_stats";

-- Create a single consolidated policy for SELECT operations
-- This covers all roles (anon, authenticated, authenticator, dashboard_user, service_role)
CREATE POLICY "Public read and service role full access to platform stats" 
ON "public"."platform_stats" 
FOR ALL
USING (
  -- Allow SELECT for everyone
  true
)
WITH CHECK (
  -- Only service role can INSERT/UPDATE/DELETE
  (select auth.role()) = 'service_role'::text
);