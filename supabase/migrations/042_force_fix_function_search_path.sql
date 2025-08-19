-- Force fix function search_path by dropping and recreating with proper signatures

-- Check current function signatures
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Current functions with mutable search_path:';
    
    FOR func_record IN 
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname IN ('update_charity_processing_status', 'trigger_acnc_population')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        RAISE NOTICE 'Function: %', func_record.proname;
    END LOOP;
END $$;

-- Drop and recreate update_charity_processing_status with all possible signatures
DROP FUNCTION IF EXISTS update_charity_processing_status(text, text, jsonb);
DROP FUNCTION IF EXISTS update_charity_processing_status(text, text);
DROP FUNCTION IF EXISTS update_charity_processing_status;

CREATE OR REPLACE FUNCTION update_charity_processing_status(
    charity_id_param text,
    status_param text,
    details_param jsonb DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE organization_cache 
    SET 
        enhanced_data_fetched_at = CASE 
            WHEN status_param = 'completed' THEN now() 
            ELSE enhanced_data_fetched_at 
        END,
        api_fetch_attempts = CASE 
            WHEN status_param = 'failed' THEN COALESCE(api_fetch_attempts, 0) + 1
            WHEN status_param = 'completed' THEN 0
            ELSE api_fetch_attempts
        END,
        last_updated = now()
    WHERE platform = 'justgiving' AND external_id = charity_id_param;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No charity found with ID: %', charity_id_param;
    END IF;
END;
$$;

-- Drop and recreate trigger_acnc_population with all possible signatures
DROP FUNCTION IF EXISTS trigger_acnc_population();
DROP FUNCTION IF EXISTS trigger_acnc_population;

CREATE OR REPLACE FUNCTION trigger_acnc_population()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM populate_all_acnc_charities();
    RAISE NOTICE 'ACNC population triggered successfully at %', now();
END;
$$;

-- Verify the functions have search_path set
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('update_charity_processing_status', 'trigger_acnc_population')
    AND p.proconfig IS NOT NULL
    AND 'search_path=public' = ANY(p.proconfig);
    
    RAISE NOTICE 'Functions with search_path=public: %', func_count;
    
    IF func_count = 2 THEN
        RAISE NOTICE '✅ Both functions now have proper search_path configuration';
    ELSE
        RAISE NOTICE '❌ Functions may still have search_path issues';
    END IF;
END $$;