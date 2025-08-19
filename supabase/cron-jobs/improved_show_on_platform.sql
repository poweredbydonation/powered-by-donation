-- Improved Show_On_Platform Cron Job
-- Schedule: Daily at 12:00 AM
-- Purpose: Hide JustGiving organizations with poor quality descriptions

UPDATE organization_cache 
SET show_on_platform = CASE 
  WHEN platform = 'justgiving' AND NOT is_meaningful_description(description) THEN false 
  ELSE true 
END;