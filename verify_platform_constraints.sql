-- VERIFICATION SQL - Run this in Supabase Dashboard SQL Editor
-- Copy and paste each section to verify current constraints

-- 1. CHECK ENUM CONSTRAINT
-- Verify if donation_platform enum exists and what values it allows
SELECT 
    typname AS enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) AS allowed_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'donation_platform'
GROUP BY typname;

-- 2. CHECK ORGANIZATION_CACHE TABLE STRUCTURE
-- Verify the platform column type and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns
WHERE table_name = 'organization_cache' 
AND column_name = 'platform';

-- 3. CHECK TABLE CONSTRAINTS
-- Look for any CHECK constraints on the platform column
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'organization_cache'
AND tc.constraint_type = 'CHECK';

-- 4. CHECK CURRENT PLATFORM VALUES
-- See what platforms actually exist in the data
SELECT 
    platform,
    COUNT(*) as organization_count
FROM organization_cache
GROUP BY platform
ORDER BY organization_count DESC;

-- 5. TEST ADDING NEW PLATFORM VALUE
-- This will fail if enum constraint exists, succeed if it's just text
-- UNCOMMENT TO TEST (will add test data):
-- INSERT INTO organization_cache (platform, external_id, name, slug) 
-- VALUES ('test_platform', 'test_123', 'Test Organization', 'test-org');

-- 6. CHECK IF WE CAN ADD ARBITRARY PLATFORM
-- Test if the column accepts any text value
-- UNCOMMENT TO TEST:
-- SELECT 'test_new_platform'::text AS test_platform_value;

-- 7. VERIFY FOREIGN KEY REFERENCES TO PLATFORM
-- Check if other tables reference platform values
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name LIKE '%platform%' OR kcu.column_name = 'platform');