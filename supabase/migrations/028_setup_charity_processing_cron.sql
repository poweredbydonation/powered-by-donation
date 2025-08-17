-- Migration: Setup charity name processing cron job and tracking
-- Date: 2025-01-15
-- Description: Automated processing of JustGiving charity names with progress tracking

-- Create function to check processing progress
CREATE OR REPLACE FUNCTION get_charity_processing_progress()
RETURNS TABLE (
  total_names integer,
  names_searched integer,
  charity_ids_found integer,
  names_cached integer,
  search_completion_pct numeric,
  cache_completion_pct numeric,
  overall_completion_pct numeric,
  last_search_activity timestamptz,
  last_cache_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_names,
    COUNT(query_datetime)::integer as names_searched,
    COUNT(charity_id)::integer as charity_ids_found,
    COUNT(add_to_cache_date)::integer as names_cached,
    ROUND(
      (COUNT(query_datetime)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2
    ) as search_completion_pct,
    ROUND(
      (COUNT(add_to_cache_date)::numeric / NULLIF(COUNT(charity_id)::numeric, 0)) * 100, 2
    ) as cache_completion_pct,
    ROUND(
      (COUNT(add_to_cache_date)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2
    ) as overall_completion_pct,
    MAX(query_datetime) as last_search_activity,
    MAX(add_to_cache_date) as last_cache_activity
  FROM public."JustGivingCharityNames";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get next batch for processing
CREATE OR REPLACE FUNCTION get_next_charity_batch(batch_size integer DEFAULT 10)
RETURNS TABLE (
  charity_name text,
  phase text,
  priority integer
) AS $$
BEGIN
  -- Phase 1: Search for charity IDs (highest priority)
  RETURN QUERY
  SELECT 
    "Charity_Name"::text,
    'search'::text as phase,
    1::integer as priority
  FROM public."JustGivingCharityNames"
  WHERE query_datetime IS NULL
  ORDER BY "Charity_Name"
  LIMIT batch_size;
  
  -- If Phase 1 complete, return Phase 2 batch
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      "Charity_Name"::text,
      'cache'::text as phase,
      2::integer as priority
    FROM public."JustGivingCharityNames"
    WHERE charity_id IS NOT NULL 
    AND add_to_cache_date IS NULL
    ORDER BY query_datetime DESC -- Process most recently found IDs first
    LIMIT batch_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely update processing status
CREATE OR REPLACE FUNCTION update_charity_processing_status(
  charity_name_param text,
  query_datetime_param timestamptz DEFAULT NULL,
  charity_id_param integer DEFAULT NULL,
  add_to_cache_date_param timestamptz DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE public."JustGivingCharityNames"
  SET 
    query_datetime = COALESCE(query_datetime_param, query_datetime),
    charity_id = COALESCE(charity_id_param, charity_id),
    add_to_cache_date = COALESCE(add_to_cache_date_param, add_to_cache_date)
  WHERE "Charity_Name" = charity_name_param;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup cron job for automated processing (every 5 minutes, very conservative)
-- This ensures we never exceed rate limits and gives plenty of buffer time
SELECT cron.schedule(
  'process-charity-names',
  '*/5 * * * *', -- Every 5 minutes
  $$
    SELECT
      net.http_post(
        url => 'https://ktwlhjgomcbbjynfefys.supabase.co/functions/v1/process-justgiving-charity-names',
        headers => ('{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}')::jsonb,
        body => '{"batchSize": 8, "source": "cron_job"}'::jsonb
      ) as request_id;
  $$
);

-- Create view for easy progress monitoring
CREATE OR REPLACE VIEW charity_processing_status AS
SELECT 
  total_names,
  names_searched,
  charity_ids_found,
  names_cached,
  search_completion_pct,
  cache_completion_pct,
  overall_completion_pct,
  last_search_activity,
  last_cache_activity,
  CASE 
    WHEN overall_completion_pct = 100 THEN 'Complete'
    WHEN cache_completion_pct IS NOT NULL THEN 'Phase 2: Caching Details'
    WHEN search_completion_pct > 0 THEN 'Phase 1: Finding IDs'
    ELSE 'Not Started'
  END as current_phase,
  CASE 
    WHEN last_cache_activity > NOW() - INTERVAL '10 minutes' THEN 'Active'
    WHEN last_search_activity > NOW() - INTERVAL '10 minutes' THEN 'Active'
    WHEN overall_completion_pct = 100 THEN 'Complete'
    ELSE 'Inactive'
  END as status
FROM get_charity_processing_progress();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_charity_processing_progress() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_next_charity_batch(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_charity_processing_status(text, timestamptz, integer, timestamptz) TO anon, authenticated;
GRANT SELECT ON charity_processing_status TO anon, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_charity_processing_progress() IS 'Returns comprehensive progress statistics for charity name processing';
COMMENT ON FUNCTION get_next_charity_batch(integer) IS 'Returns next batch of charity names to process, prioritizing search phase over cache phase';
COMMENT ON FUNCTION update_charity_processing_status(text, timestamptz, integer, timestamptz) IS 'Safely updates processing status for individual charity names';
COMMENT ON VIEW charity_processing_status IS 'Real-time view of charity processing progress and status';

/*
Usage Examples:

-- Check overall progress
SELECT * FROM charity_processing_status;

-- Get detailed progress
SELECT * FROM get_charity_processing_progress();

-- Get next batch for manual processing
SELECT * FROM get_next_charity_batch(5);

-- Update single charity status
SELECT update_charity_processing_status(
  'Charity Name', 
  NOW(), -- query_datetime
  12345,  -- charity_id
  NULL    -- add_to_cache_date (not cached yet)
);

Rollback Instructions:
To rollback this migration, run:

SELECT cron.unschedule('process-charity-names');
DROP VIEW IF EXISTS charity_processing_status;
DROP FUNCTION IF EXISTS update_charity_processing_status(text, timestamptz, integer, timestamptz);
DROP FUNCTION IF EXISTS get_next_charity_batch(integer);
DROP FUNCTION IF EXISTS get_charity_processing_progress();
*/