-- Add RLS policies for tables that have RLS enabled but no policies
-- Using correct case-sensitive table names

-- 1. Add policy for "ACNC_Registered_Charities" table (note the quotes for case sensitivity)
-- This appears to be reference data that should be publicly readable
CREATE POLICY "Allow public read access to ACNC_Registered_Charities" 
ON "ACNC_Registered_Charities"
FOR SELECT 
USING (true);

-- Allow service role to manage the data
CREATE POLICY "Allow service role to manage ACNC_Registered_Charities" 
ON "ACNC_Registered_Charities"
FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Add policy for "JustGivingCharityNames" table (note the quotes for case sensitivity)
-- This appears to be reference data that should be publicly readable
CREATE POLICY "Allow public read access to JustGivingCharityNames" 
ON "JustGivingCharityNames"
FOR SELECT 
USING (true);

-- Allow service role to manage the data
CREATE POLICY "Allow service role to manage JustGivingCharityNames" 
ON "JustGivingCharityNames"
FOR ALL 
USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE "ACNC_Registered_Charities" IS 'ACNC charity reference data. Public read access with service role management.';
COMMENT ON TABLE "JustGivingCharityNames" IS 'JustGiving charity reference data. Public read access with service role management.';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'RLS policies added for reference data tables:';
    RAISE NOTICE '  ✅ ACNC_Registered_Charities: Public read + service role management';
    RAISE NOTICE '  ✅ JustGivingCharityNames: Public read + service role management';
    RAISE NOTICE '  ✅ Both tables now have proper RLS policies';
END $$;