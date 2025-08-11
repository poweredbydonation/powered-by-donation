-- Setup Every.org nonprofit cache population cron job
-- This migration creates a scheduled job to populate the Every.org nonprofit cache

-- Create cron job to populate Every.org nonprofit cache daily at 3 AM UTC
SELECT cron.schedule(
    'populate-everyorg-cache',
    '0 3 * * *', -- Daily at 3 AM UTC (offset from JustGiving job)
    'SELECT net.http_post(url := (SELECT ''http://127.0.0.1:54321/functions/v1/populate-everyorg-nonprofit-cache''::text), headers := jsonb_build_object(''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''supabase_service_role_key'')), timeout_milliseconds := 300000);'
);

-- Add comment for documentation
COMMENT ON FUNCTION cron.schedule IS 'Scheduled jobs for automated data population and maintenance';

-- Update table comment to reflect active caching
COMMENT ON TABLE every_org_nonprofit_cache IS 'Cached Every.org nonprofit data - populated daily via cron job';