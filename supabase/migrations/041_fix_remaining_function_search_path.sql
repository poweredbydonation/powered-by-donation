-- Fix the remaining 2 functions with search_path warnings

-- 1. Fix update_charity_processing_status function
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
END;
$$;

-- 2. Fix trigger_acnc_population function
CREATE OR REPLACE FUNCTION trigger_acnc_population()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM populate_all_acnc_charities();
    RAISE NOTICE 'ACNC population triggered successfully';
END;
$$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Remaining function search_path fixes completed:';
    RAISE NOTICE '  ✅ update_charity_processing_status: SET search_path = public';
    RAISE NOTICE '  ✅ trigger_acnc_population: SET search_path = public';
    RAISE NOTICE 'All function security warnings should now be resolved.';
END $$;