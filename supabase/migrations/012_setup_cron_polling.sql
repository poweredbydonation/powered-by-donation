-- Enable pg_cron extension for automated donation polling
-- Migration: 012_setup_cron_polling.sql
-- Purpose: Setup automated 5-minute polling for donation status updates

-- Enable pg_cron extension (required for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to poll donation statuses every 5 minutes
-- This will call the check-donations edge function to update pending donations
-- NOTE: Service key must be configured separately via Supabase dashboard
-- Go to Settings > Database > Cron Jobs and manually create the job with proper authentication
-- 
-- Manual setup required:
-- 1. Go to Supabase Dashboard > Settings > Database > Cron Jobs
-- 2. Create new job: poll-donation-statuses
-- 3. Schedule: */5 * * * *
-- 4. Command: SELECT extensions.http('POST', 'https://ktwlhjgomcbbjynfefys.supabase.co/functions/v1/check-donations', '{}', 'application/json', ARRAY[extensions.http_header('Authorization', 'Bearer [SERVICE_ROLE_KEY]'), extensions.http_header('Content-Type', 'application/json')]);
-- 
-- SECURITY: Replace [SERVICE_ROLE_KEY] with actual service role key from dashboard
-- DO NOT commit service keys to version control

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'poll-donation-statuses';