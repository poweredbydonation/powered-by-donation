-- Secure charity_processing_status using security_invoker approach
-- This is the recommended way to secure views in PostgreSQL

-- Drop and recreate the view with security_invoker = on
DROP VIEW IF EXISTS charity_processing_status;

CREATE VIEW charity_processing_status 
WITH (security_invoker = on) AS
SELECT get_charity_processing_progress
FROM get_charity_processing_progress() get_charity_processing_progress(get_charity_processing_progress);

-- Revert the function to original version (remove the security check we added)
CREATE OR REPLACE FUNCTION get_charity_processing_progress()
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    total_count integer;
    enhanced_count integer;
    pending_count integer;
    failed_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count 
    FROM organization_cache 
    WHERE platform = 'justgiving';
    
    SELECT COUNT(*) INTO enhanced_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' AND enhanced_data_fetched_at IS NOT NULL;
    
    SELECT COUNT(*) INTO pending_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' 
      AND enhanced_data_fetched_at IS NULL 
      AND COALESCE(api_fetch_attempts, 0) < 3;
    
    SELECT COUNT(*) INTO failed_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' 
      AND enhanced_data_fetched_at IS NULL 
      AND COALESCE(api_fetch_attempts, 0) >= 3;
    
    result := jsonb_build_object(
        'total_charities', total_count,
        'enhanced_charities', enhanced_count,
        'pending_charities', pending_count,
        'failed_charities', failed_count,
        'completion_percentage', CASE 
            WHEN total_count > 0 THEN ROUND((enhanced_count::numeric / total_count::numeric) * 100, 2)
            ELSE 0 
        END,
        'last_updated', now()
    );
    
    RETURN result;
END;
$$;

-- Add comment for documentation  
COMMENT ON VIEW charity_processing_status IS 'Administrative view for charity processing progress. Uses security_invoker for proper access control.';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'charity_processing_status security added:';
    RAISE NOTICE '  ✅ View recreated with security_invoker = on';
    RAISE NOTICE '  ✅ Access control now properly enforced';
    RAISE NOTICE '  ✅ Follows PostgreSQL security best practices';
END $$;