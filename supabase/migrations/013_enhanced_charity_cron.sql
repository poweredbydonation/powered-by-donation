-- Migration 013: Enhanced Charity Details Cron Job
-- Sets up automated fetching of enhanced charity data every 30 minutes

-- Ensure the pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add cron job for enhanced charity details fetching
-- Runs every 30 minutes to process 20 charities at a time
-- Completes all 1700+ charities in approximately 4 days

SELECT cron.schedule(
    'fetch-enhanced-charity-details',
    '*/30 * * * *', -- Every 30 minutes
    'SELECT net.http_post(
        url := ''https://ktwlhjgomcbbjynfefys.supabase.co/functions/v1/fetch-enhanced-charity-details'',
        headers := ''{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting(''app.supabase_service_role_key'')}'',
        body := ''{}''
    ) as response;'
);

-- Check cron job was created successfully
-- To view all cron jobs: SELECT * FROM cron.job;
-- To remove job if needed: SELECT cron.unschedule('fetch-enhanced-charity-details');

COMMENT ON EXTENSION pg_cron IS 'Automated task scheduling for enhanced charity data fetching';