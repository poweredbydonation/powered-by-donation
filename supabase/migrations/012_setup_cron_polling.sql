-- Enable pg_cron extension for automated donation polling
-- Migration: 012_setup_cron_polling.sql
-- Purpose: Setup automated 5-minute polling for donation status updates

-- Enable pg_cron extension (required for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to poll donation statuses every 5 minutes
-- This will call the check-donations edge function to update pending donations
SELECT cron.schedule(
  'poll-donation-statuses', -- job name
  '*/5 * * * *',            -- every 5 minutes
  $$
  SELECT extensions.http(
    'POST',
    'https://ktwlhjgomcbbjynfefys.supabase.co/functions/v1/check-donations',
    '{}',
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0d2xoamdvbWNiYmp5bmZlZnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzc4OTI1MiwiZXhwIjoyMDY5MzY1MjUyfQ.OxKw6V1gpKaEhQ3A2-sXGvscVYCuY7AzPj3YXil5aUU'),
      extensions.http_header('Content-Type', 'application/json')
    ]
  );
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'poll-donation-statuses';