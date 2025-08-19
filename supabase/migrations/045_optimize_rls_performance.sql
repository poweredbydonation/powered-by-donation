-- Optimize RLS performance by fixing auth.role() calls and consolidating policies
-- This addresses multiple performance warnings

-- Step 1: Fix auth.role() performance by wrapping in SELECT subqueries
-- This prevents re-evaluation for each row

-- Fix organization_cache policies
DROP POLICY IF EXISTS "Allow service role to manage organization_cache" ON organization_cache;
DROP POLICY IF EXISTS "edge_functions_access_organization_cache" ON organization_cache;

CREATE POLICY "Allow service role to manage organization_cache" ON organization_cache
FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- Fix acnc_cron_logs policies  
DROP POLICY IF EXISTS "Service role can manage acnc cron logs" ON acnc_cron_logs;
DROP POLICY IF EXISTS "edge_functions_access_acnc_cron_logs" ON acnc_cron_logs;
DROP POLICY IF EXISTS "acnc_cron_logs_service_role_policy" ON acnc_cron_logs;

CREATE POLICY "Service role can manage acnc cron logs" ON acnc_cron_logs
FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- Fix ACNC_Registered_Charities policies
DROP POLICY IF EXISTS "Allow service role to manage ACNC_Registered_Charities" ON "ACNC_Registered_Charities";

CREATE POLICY "Allow service role to manage ACNC_Registered_Charities" ON "ACNC_Registered_Charities"
FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- Fix JustGivingCharityNames policies
DROP POLICY IF EXISTS "Allow service role to manage JustGivingCharityNames" ON "JustGivingCharityNames";

CREATE POLICY "Allow service role to manage JustGivingCharityNames" ON "JustGivingCharityNames"
FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- Step 2: Remove duplicate indexes for better performance

-- Remove duplicate constraint from every_org_nonprofit_cache (which drops the index)
ALTER TABLE every_org_nonprofit_cache DROP CONSTRAINT IF EXISTS every_org_nonprofit_cache_slug_key;

-- Remove duplicate indexes from justgiving_charity_cache
DROP INDEX IF EXISTS idx_justgiving_charity_cache_enhanced_fetched;
DROP INDEX IF EXISTS idx_justgiving_charity_cache_registration_number;
DROP INDEX IF EXISTS idx_charity_cache_stats;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS performance optimization completed:';
    RAISE NOTICE '  ✅ Fixed auth.role() calls with SELECT subqueries';
    RAISE NOTICE '  ✅ Consolidated duplicate RLS policies';
    RAISE NOTICE '  ✅ Removed duplicate indexes';
    RAISE NOTICE '  ✅ Performance should be significantly improved';
END $$;