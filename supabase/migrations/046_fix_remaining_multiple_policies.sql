-- Fix remaining multiple permissive policies by consolidating overlapping SELECT policies
-- The issue is public read policies conflict with service role ALL policies for SELECT operations

-- Fix ACNC_Registered_Charities table
DROP POLICY IF EXISTS "Allow public read access to ACNC_Registered_Charities" ON "ACNC_Registered_Charities";
DROP POLICY IF EXISTS "Allow service role to manage ACNC_Registered_Charities" ON "ACNC_Registered_Charities";

-- Create single consolidated policy that allows both public read AND service role management
CREATE POLICY "ACNC_Registered_Charities_access_policy" ON "ACNC_Registered_Charities"
FOR ALL USING (
  -- Allow public read access OR service role for all operations
  CASE 
    WHEN (SELECT current_setting('request.method', true)) = 'GET' THEN true
    ELSE (SELECT auth.role()) = 'service_role'
  END
);

-- Fix JustGivingCharityNames table
DROP POLICY IF EXISTS "Allow public read access to JustGivingCharityNames" ON "JustGivingCharityNames";
DROP POLICY IF EXISTS "Allow service role to manage JustGivingCharityNames" ON "JustGivingCharityNames";

-- Create single consolidated policy
CREATE POLICY "JustGivingCharityNames_access_policy" ON "JustGivingCharityNames"
FOR ALL USING (
  -- Allow public read access OR service role for all operations
  CASE 
    WHEN (SELECT current_setting('request.method', true)) = 'GET' THEN true
    ELSE (SELECT auth.role()) = 'service_role'
  END
);

-- Fix organization_cache table
DROP POLICY IF EXISTS "Allow public read access to organization_cache" ON organization_cache;
DROP POLICY IF EXISTS "Allow service role to manage organization_cache" ON organization_cache;

-- Create separate policies for different operations to avoid conflicts
CREATE POLICY "organization_cache_public_read" ON organization_cache
FOR SELECT USING (true);

CREATE POLICY "organization_cache_service_insert" ON organization_cache
FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "organization_cache_service_update" ON organization_cache
FOR UPDATE USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "organization_cache_service_delete" ON organization_cache
FOR DELETE USING ((SELECT auth.role()) = 'service_role');

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Multiple permissive policies fixed:';
    RAISE NOTICE '  ✅ ACNC_Registered_Charities: Consolidated into single policy';
    RAISE NOTICE '  ✅ JustGivingCharityNames: Consolidated into single policy';
    RAISE NOTICE '  ✅ organization_cache: Separated read/write policies';
    RAISE NOTICE '  ✅ All multiple policy warnings should be resolved';
END $$;