-- Setup SQL-based cron job for lookup table population
-- This replaces the Edge Function approach with direct SQL execution

-- Create the new cron job that calls the SQL function directly
SELECT cron.schedule(
  'populate-lookup-tables-sql',  -- new job name
  '0 3 * * *',                   -- daily at 3 AM UTC (same schedule as original)
  'SELECT populate_lookup_tables_direct();'  -- call the SQL function directly
);

-- Remove the old Edge Function cron job (if it exists)
DO $$ 
BEGIN
    PERFORM cron.unschedule('populate-filter-lookup-tables');
EXCEPTION 
    WHEN OTHERS THEN 
        -- Job doesn't exist, continue silently
        NULL;
END $$;

-- Add comment to document the change
COMMENT ON FUNCTION populate_lookup_tables_direct() IS 'Direct SQL function to populate all lookup tables with show_on_platform filter. Replaces Edge Function approach for better performance and reliability.';