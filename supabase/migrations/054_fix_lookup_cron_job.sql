-- Fix the lookup table population cron job
-- Remove the problematic service_role_key configuration

-- First, unschedule the existing job if it exists (ignore errors if it doesn't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('populate_filter_lookup_tables');
    RAISE NOTICE 'Unscheduled existing populate_filter_lookup_tables job';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Job populate_filter_lookup_tables did not exist, continuing...';
END
$$;

-- Create a new cron job that calls the edge function without auth header
-- Since this is running internally, we don't need the Authorization header
SELECT cron.schedule(
  'populate_filter_lookup_tables',
  '0 1 * * *', -- Daily at 1 AM UTC
  $$
    SELECT
      net.http_post(
        url := 'https://qlqojsykdqagoqhzjojt.supabase.co/functions/v1/populate_filter_lookup_tables',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      ) as request_id;
  $$
);

-- Alternative approach: Create a stored procedure that calls the lookup population directly
-- This avoids the HTTP call entirely and runs the logic in SQL

CREATE OR REPLACE FUNCTION populate_lookup_tables_direct()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  org_record RECORD;
BEGIN
  -- Clear existing lookup tables
  TRUNCATE TABLE justgiving_countries_lookup;
  TRUNCATE TABLE justgiving_cities_lookup;
  TRUNCATE TABLE acnc_categories_lookup;
  TRUNCATE TABLE acnc_purposes_lookup;
  TRUNCATE TABLE acnc_beneficiaries_lookup;
  TRUNCATE TABLE acnc_cities_lookup;
  TRUNCATE TABLE acnc_states_lookup;
  TRUNCATE TABLE acnc_operating_countries_lookup;
  TRUNCATE TABLE everyorg_categories_lookup;

  RAISE NOTICE 'Cleared all lookup tables';

  -- Populate JustGiving lookups
  INSERT INTO justgiving_countries_lookup (country)
  SELECT DISTINCT address_country
  FROM organization_cache
  WHERE platform = 'justgiving' 
    AND is_active = true 
    AND show_on_platform = true
    AND address_country IS NOT NULL
    AND address_country != ''
  ORDER BY address_country;

  INSERT INTO justgiving_cities_lookup (city)
  SELECT DISTINCT address_city
  FROM organization_cache
  WHERE platform = 'justgiving' 
    AND is_active = true 
    AND show_on_platform = true
    AND address_city IS NOT NULL
    AND address_city != ''
  ORDER BY address_city;

  -- Populate ACNC lookups
  INSERT INTO acnc_categories_lookup (category)
  SELECT DISTINCT category
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND category IS NOT NULL
    AND category != ''
  ORDER BY category;

  INSERT INTO acnc_cities_lookup (city)
  SELECT DISTINCT address_city
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND address_city IS NOT NULL
    AND address_city != ''
  ORDER BY address_city;

  INSERT INTO acnc_states_lookup (state)
  SELECT DISTINCT state
  FROM (
    SELECT unnest(ARRAY[
      CASE WHEN acnc_operates_in_act = 'Y' THEN 'ACT' END,
      CASE WHEN acnc_operates_in_nsw = 'Y' THEN 'NSW' END,
      CASE WHEN acnc_operates_in_nt = 'Y' THEN 'NT' END,
      CASE WHEN acnc_operates_in_qld = 'Y' THEN 'QLD' END,
      CASE WHEN acnc_operates_in_sa = 'Y' THEN 'SA' END,
      CASE WHEN acnc_operates_in_tas = 'Y' THEN 'TAS' END,
      CASE WHEN acnc_operates_in_vic = 'Y' THEN 'VIC' END,
      CASE WHEN acnc_operates_in_wa = 'Y' THEN 'WA' END
    ]) as state
    FROM organization_cache
    WHERE platform = 'acnc' 
      AND is_active = true 
      AND show_on_platform = true
  ) states
  WHERE state IS NOT NULL
  ORDER BY state;

  INSERT INTO acnc_operating_countries_lookup (country)
  SELECT DISTINCT acnc_operating_countries
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND acnc_operating_countries IS NOT NULL
    AND acnc_operating_countries != ''
  ORDER BY acnc_operating_countries;

  INSERT INTO acnc_purposes_lookup (purpose)
  SELECT DISTINCT jsonb_object_keys(acnc_purposes) as purpose
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND acnc_purposes IS NOT NULL
    AND jsonb_typeof(acnc_purposes) = 'object'
  ORDER BY purpose;

  INSERT INTO acnc_beneficiaries_lookup (beneficiary)
  SELECT DISTINCT jsonb_object_keys(acnc_beneficiaries) as beneficiary
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND acnc_beneficiaries IS NOT NULL
    AND jsonb_typeof(acnc_beneficiaries) = 'object'
  ORDER BY beneficiary;

  -- Populate Every.org lookups
  INSERT INTO everyorg_categories_lookup (category)
  SELECT DISTINCT category
  FROM organization_cache
  WHERE platform = 'everyorg' 
    AND is_active = true 
    AND show_on_platform = true
    AND category IS NOT NULL
    AND category != ''
  ORDER BY category;

  RAISE NOTICE 'Successfully populated all lookup tables';
END;
$$;

-- Create an alternative cron job that uses the stored procedure instead of HTTP call
SELECT cron.schedule(
  'populate_filter_lookup_tables_direct',
  '0 1 * * *', -- Daily at 1 AM UTC
  'SELECT populate_lookup_tables_direct();'
);

-- Comment on the function
COMMENT ON FUNCTION populate_lookup_tables_direct() 
IS 'Directly populates all filter lookup tables from organization_cache, respecting show_on_platform flag. Used by cron job to avoid HTTP auth issues.';