-- Remove existing cron job if it exists
SELECT cron.unschedule('populate-filter-lookup-tables');

-- Add cron job to populate filter lookup tables daily
-- This will run every day at 2 AM to refresh filter options
-- Using anon key since the function has public access and the lookup tables are public

SELECT cron.schedule(
  'populate-filter-lookup-tables',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qlqojsykdqagoqhzjojt.supabase.co/functions/v1/populate_filter_lookup_tables',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscW9qc3lrZHFhZ29xaHpqb2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI1NjgzNjQsImV4cCI6MjAzODE0NDM2NH0.CK6h96B5nt2-Nc47wAKOUIY6Rd5QOJr8MV7xT_hLI2c'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);