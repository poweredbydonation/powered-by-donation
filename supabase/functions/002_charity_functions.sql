-- Database Functions: Charity Statistics and Public Data
-- These functions manage charity statistics and provide public access to charity data
-- Updated for current schema and fundraiser/donor terminology

-- Function 1: Get Public Charity Statistics
CREATE OR REPLACE FUNCTION public.get_charity_public_stats(charity_slug text)
RETURNS TABLE(
    name text, 
    description text, 
    logo_url text, 
    total_donations_count integer, 
    total_amount_received numeric, 
    this_month_count integer, 
    this_month_amount numeric, 
    service_categories jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    cc.name,
    cc.description,
    cc.logo_url,
    cc.total_donations_count,
    cc.total_amount_received,
    cc.this_month_count,
    cc.this_month_amount,
    cc.service_categories
  FROM charity_cache cc
  WHERE cc.slug = charity_slug AND cc.is_active = true;
$function$;

-- Function 2: Increment Charity Statistics
CREATE OR REPLACE FUNCTION public.increment_charity_stats(
    charity_id text, 
    amount numeric, 
    service_category text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update charity statistics
  INSERT INTO charity_cache (
    justgiving_charity_id, 
    name, 
    slug,
    total_donations_count, 
    total_amount_received,
    this_month_count,
    this_month_amount,
    service_categories,
    stats_last_updated
  ) VALUES (
    charity_id,
    'Unknown Charity', -- Will be updated by JustGiving sync
    LOWER(REPLACE(charity_id, ' ', '-')), -- Temporary slug
    1,
    amount,
    1,
    amount,
    CASE 
      WHEN service_category IS NOT NULL THEN json_build_object(service_category, 1)::jsonb
      ELSE '{}'::jsonb
    END,
    NOW()
  )
  ON CONFLICT (justgiving_charity_id) 
  DO UPDATE SET
    total_donations_count = charity_cache.total_donations_count + 1,
    total_amount_received = charity_cache.total_amount_received + amount,
    this_month_count = charity_cache.this_month_count + 1,
    this_month_amount = charity_cache.this_month_amount + amount,
    service_categories = CASE
      WHEN service_category IS NOT NULL THEN
        charity_cache.service_categories || 
        json_build_object(
          service_category, 
          COALESCE((charity_cache.service_categories->>service_category)::integer, 0) + 1
        )::jsonb
      ELSE charity_cache.service_categories
    END,
    stats_last_updated = NOW();
END;
$function$;

-- Function 3: Reset Monthly Charity Statistics
CREATE OR REPLACE FUNCTION public.reset_monthly_charity_stats()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE charity_cache 
  SET 
    this_month_count = 0,
    this_month_amount = 0,
    stats_last_updated = NOW();
END;
$function$;