-- Complete Every.org Cron Job Configuration
-- Consolidates migrations 020 and 032 into single comprehensive migration
-- Sets up systematic Every.org nonprofit cache population

-- Note: The organization_cache table uses external_id field for both
-- JustGiving charity IDs and Every.org EINs, so no specific everyorg_ein column exists
-- The external_id field is already nullable to support international nonprofits without EINs

-- Set up Every.org nonprofit cache population cron job
-- Runs daily at 3 AM UTC to systematically populate nonprofit cache
-- First unschedule if it exists, then schedule
DO $$
BEGIN
    PERFORM cron.unschedule('everyorg-nonprofit-population');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

SELECT cron.schedule(
  'everyorg-nonprofit-population',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
    SELECT net.http_post(
      url := current_setting('app.base_url') || '/functions/v1/everyorg_populate_cache',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'systematic_processing', true,
        'max_runtime_minutes', 4.5
      )
    );
  $$
);

-- Update JustGiving cron job to use new organized function path
-- Handle legacy job names safely
DO $$
BEGIN
    PERFORM cron.unschedule('populate-charity-cache-daily');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('justgiving-charity-population');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

SELECT cron.schedule(
  'justgiving-charity-population', 
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
    SELECT net.http_post(
      url := current_setting('app.base_url') || '/functions/v1/justgiving_populate_cache',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);

-- Update donation status checking cron job to use new organized function path
DO $$
BEGIN
    PERFORM cron.unschedule('check-donations-every-5-minutes');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('donation-status-checking');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

SELECT cron.schedule(
  'donation-status-checking',
  '*/5 * * * *', -- Every 5 minutes
  $$
    SELECT net.http_post(
      url := current_setting('app.base_url') || '/functions/v1/check_donations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);

-- Update enhanced charity details fetching cron job to use new organized function path
DO $$
BEGIN
    PERFORM cron.unschedule('fetch-enhanced-charity-details');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('enhanced-charity-details-fetching');
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if job doesn't exist
END $$;

SELECT cron.schedule(
  'enhanced-charity-details-fetching',
  '*/30 * * * *', -- Every 30 minutes
  $$
    SELECT net.http_post(
      url := current_setting('app.base_url') || '/functions/v1/fetch_enhanced_charity_details',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);

-- Migration completed successfully
-- All cron jobs have been organized with new function paths:
-- - JustGiving charity population: Daily 2 AM UTC
-- - Every.org nonprofit population: Daily 3 AM UTC  
-- - Donation status checking: Every 5 minutes
-- - Enhanced charity details: Every 30 minutes
-- - ACNC charity processing: Every 2 hours (from separate migration)