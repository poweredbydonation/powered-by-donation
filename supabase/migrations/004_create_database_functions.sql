-- Migration 004: Create Database Functions for Stats and Calculations
-- Based on CLAUDE.md charity stats and happiness calculation requirements

-- Function to increment charity statistics when donations complete
CREATE OR REPLACE FUNCTION increment_charity_stats(
  charity_id TEXT,
  amount DECIMAL,
  service_category TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
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
$$;

-- Function to calculate provider happiness metrics
CREATE OR REPLACE FUNCTION calculate_provider_happiness(provider_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_supporter_ratings INTEGER;
  happy_supporter_ratings INTEGER;
  total_provider_ratings INTEGER;
  happy_provider_ratings INTEGER;
BEGIN
  -- Calculate received happiness (how supporters rate this provider)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE supporter_rates_provider = 'happy')
  INTO total_supporter_ratings, happy_supporter_ratings
  FROM service_requests 
  WHERE provider_id = provider_uuid 
    AND supporter_rates_provider IS NOT NULL;

  -- Calculate sent happiness (how this provider rates supporters)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE provider_rates_supporter = 'happy')
  INTO total_provider_ratings, happy_provider_ratings
  FROM service_requests 
  WHERE provider_id = provider_uuid 
    AND provider_rates_supporter IS NOT NULL;

  -- Update provider happiness metrics
  UPDATE providers 
  SET 
    received_happiness = CASE 
      WHEN total_supporter_ratings > 0 THEN 
        ROUND((happy_supporter_ratings::decimal / total_supporter_ratings) * 100)
      ELSE NULL 
    END,
    sent_happiness = CASE 
      WHEN total_provider_ratings > 0 THEN 
        ROUND((happy_provider_ratings::decimal / total_provider_ratings) * 100)
      ELSE NULL 
    END
  WHERE id = provider_uuid;
END;
$$;

-- Function to calculate supporter happiness metrics
CREATE OR REPLACE FUNCTION calculate_supporter_happiness(supporter_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_provider_ratings INTEGER;
  happy_provider_ratings INTEGER;
  total_supporter_ratings INTEGER;
  happy_supporter_ratings INTEGER;
BEGIN
  -- Calculate received happiness (how providers rate this supporter)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE provider_rates_supporter = 'happy')
  INTO total_provider_ratings, happy_provider_ratings
  FROM service_requests 
  WHERE supporter_id = supporter_uuid 
    AND provider_rates_supporter IS NOT NULL;

  -- Calculate sent happiness (how this supporter rates providers/services)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE supporter_rates_provider = 'happy' OR supporter_rates_service = 'happy')
  INTO total_supporter_ratings, happy_supporter_ratings
  FROM service_requests 
  WHERE supporter_id = supporter_uuid 
    AND (supporter_rates_provider IS NOT NULL OR supporter_rates_service IS NOT NULL);

  -- Update supporter happiness metrics
  UPDATE supporters 
  SET 
    received_happiness = CASE 
      WHEN total_provider_ratings > 0 THEN 
        ROUND((happy_provider_ratings::decimal / total_provider_ratings) * 100)
      ELSE NULL 
    END,
    sent_happiness = CASE 
      WHEN total_supporter_ratings > 0 THEN 
        ROUND((happy_supporter_ratings::decimal / total_supporter_ratings) * 100)
      ELSE NULL 
    END
  WHERE id = supporter_uuid;
END;
$$;

-- Function to calculate service happiness rate
CREATE OR REPLACE FUNCTION calculate_service_happiness(service_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_ratings INTEGER;
  happy_ratings INTEGER;
BEGIN
  -- Calculate service happiness rate
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE supporter_rates_service = 'happy')
  INTO total_ratings, happy_ratings
  FROM service_requests 
  WHERE service_id = service_uuid 
    AND supporter_rates_service IS NOT NULL;

  -- Update service happiness rate
  UPDATE services 
  SET happiness_rate = CASE 
    WHEN total_ratings > 0 THEN 
      ROUND((happy_ratings::decimal / total_ratings) * 100)
    ELSE NULL 
  END
  WHERE id = service_uuid;
END;
$$;

-- Function to reset monthly charity statistics (run monthly)
CREATE OR REPLACE FUNCTION reset_monthly_charity_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE charity_cache 
  SET 
    this_month_count = 0,
    this_month_amount = 0,
    stats_last_updated = NOW();
END;
$$;

-- Trigger to update happiness metrics when service_requests are updated
CREATE OR REPLACE FUNCTION trigger_update_happiness_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if rating fields changed
  IF (OLD.supporter_rates_provider IS DISTINCT FROM NEW.supporter_rates_provider) OR
     (OLD.provider_rates_supporter IS DISTINCT FROM NEW.provider_rates_supporter) OR
     (OLD.supporter_rates_service IS DISTINCT FROM NEW.supporter_rates_service) THEN
    
    -- Update provider happiness
    PERFORM calculate_provider_happiness(NEW.provider_id);
    
    -- Update supporter happiness
    PERFORM calculate_supporter_happiness(NEW.supporter_id);
    
    -- Update service happiness
    PERFORM calculate_service_happiness(NEW.service_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic happiness updates
DROP TRIGGER IF EXISTS update_happiness_metrics_trigger ON service_requests;
CREATE TRIGGER update_happiness_metrics_trigger
  AFTER UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_happiness_metrics();