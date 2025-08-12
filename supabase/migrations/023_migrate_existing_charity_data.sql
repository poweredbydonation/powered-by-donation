-- Migrate existing charity data to unified organization_cache table
-- Phase 2 of Platform-First restructuring

-- Insert data from justgiving_charity_cache
INSERT INTO organization_cache (
  platform,
  external_id,
  name,
  description,
  category,
  logo_url,
  slug,
  total_donations_count,
  total_amount_received,
  this_month_count,
  this_month_amount,
  service_categories,
  is_active,
  is_featured,
  page_views,
  last_updated,
  stats_last_updated,
  address_line1,
  address_line2,
  address_city,
  address_county,
  address_country,
  address_postcode,
  display_name,
  logo_absolute_url,
  profile_page_url,
  registration_number,
  website_url,
  email_address,
  keywords,
  page_short_name,
  sms_short_name,
  is_approved,
  show_in_search,
  date_added_to_justgiving,
  thankyou_message,
  impact_statement_what,
  impact_statement_why,
  country_code,
  currency_code,
  mobile_appeals,
  donation_display_amounts,
  theme_colour,
  categories_list,
  enhanced_data_fetched_at,
  api_fetch_attempts,
  fts
)
SELECT
  'justgiving'::donation_platform as platform,
  justgiving_charity_id as external_id,
  name,
  description,
  category,
  logo_url,
  slug,
  total_donations_count,
  total_amount_received,
  this_month_count,
  this_month_amount,
  service_categories,
  is_active,
  is_featured,
  page_views,
  last_updated,
  stats_last_updated,
  address_line1,
  address_line2,
  address_city,
  address_county,
  address_country,
  address_postcode,
  display_name,
  logo_absolute_url,
  profile_page_url,
  registration_number,
  website_url,
  email_address,
  keywords,
  page_short_name,
  sms_short_name,
  is_approved,
  show_in_search,
  date_added_to_justgiving,
  thankyou_message,
  impact_statement_what,
  impact_statement_why,
  country_code,
  currency_code,
  mobile_appeals,
  donation_display_amounts,
  theme_colour,
  categories_list,
  enhanced_data_fetched_at,
  api_fetch_attempts,
  fts
FROM justgiving_charity_cache;

-- Insert data from every_org_nonprofit_cache
INSERT INTO organization_cache (
  platform,
  external_id,
  name,
  description,
  category,
  logo_url,
  slug,
  total_donations_count,
  total_amount_received,
  this_month_count,
  this_month_amount,
  service_categories,
  is_active,
  is_featured,
  page_views,
  last_updated,
  stats_last_updated
)
SELECT
  'every_org'::donation_platform as platform,
  CASE 
    WHEN nonprofit_ein IS NOT NULL AND nonprofit_ein != '' THEN nonprofit_ein
    ELSE 'slug_' || slug -- Use slug-based ID for nonprofits without EIN
  END as external_id,
  name,
  description,
  category,
  logo_url,
  slug,
  total_donations_count,
  total_amount_received,
  this_month_count,
  this_month_amount,
  service_categories,
  is_active,
  is_featured,
  page_views,
  last_updated,
  stats_last_updated
FROM every_org_nonprofit_cache;

-- Log migration results
DO $$
DECLARE
  justgiving_count integer;
  everyorg_count integer;
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO justgiving_count FROM organization_cache WHERE platform = 'justgiving';
  SELECT COUNT(*) INTO everyorg_count FROM organization_cache WHERE platform = 'every_org';
  SELECT COUNT(*) INTO total_count FROM organization_cache;
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  JustGiving organizations: %', justgiving_count;
  RAISE NOTICE '  Every.org organizations: %', everyorg_count;
  RAISE NOTICE '  Total organizations: %', total_count;
END $$;

-- Verify data integrity
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Check for any unexpected duplicates
  SELECT COUNT(*) INTO duplicate_count 
  FROM (
    SELECT platform, external_id, COUNT(*)
    FROM organization_cache
    GROUP BY platform, external_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate platform/external_id combinations', duplicate_count;
  ELSE
    RAISE NOTICE 'Data integrity check passed: No duplicates found';
  END IF;
END $$;