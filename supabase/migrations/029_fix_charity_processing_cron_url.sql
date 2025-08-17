-- Migration: Fix charity processing cron job URL
-- Date: 2025-01-15
-- Description: Update cron job with correct Supabase project URL

-- First, unschedule the existing cron job with placeholder URL
SELECT cron.unschedule('process-charity-names');

-- Setup cron job with correct project URL and proper authentication
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

-- Verify the cron job was scheduled correctly
-- SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'process-charity-names';

/*
Expected Output:
jobname: process-charity-names
schedule: every 5 minutes
command: SELECT net.http_post(url := 'https://ktwlhjgomcbbjynfefys.supabase.co/functions/v1/process-justgiving-charity-names', ...)

Next Steps:
1. Apply this migration to fix the cron job URL
2. Deploy the edge function: supabase functions deploy process-justgiving-charity-names
3. Check cron execution logs in ~5-10 minutes
4. Monitor progress with: SELECT * FROM charity_processing_status;

Rollback Instructions:
SELECT cron.unschedule('process-charity-names');
*/