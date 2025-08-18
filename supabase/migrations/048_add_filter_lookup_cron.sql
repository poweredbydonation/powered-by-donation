-- Add cron job to populate filter lookup tables daily
-- This will run every day at 2 AM to refresh filter options

SELECT cron.schedule(
  'populate-filter-lookup-tables',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qlqojsykdqagoqhzjojt.supabase.co/functions/v1/populate_filter_lookup_tables',
      headers := ('{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}')::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);