-- Database Functions: Happiness Calculation System
-- These functions calculate and maintain happiness metrics for fundraisers, donors, and services
-- Updated for fundraiser/donor terminology (was provider/supporter)

-- Function 1: Calculate Fundraiser Happiness
CREATE OR REPLACE FUNCTION public.calculate_fundraiser_happiness(fundraiser_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  total_donor_ratings INTEGER;
  happy_donor_ratings INTEGER;
  total_fundraiser_ratings INTEGER;
  happy_fundraiser_ratings INTEGER;
BEGIN
  -- Calculate received happiness (how donors rate this fundraiser)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE donor_rates_fundraiser = 'happy')
  INTO total_donor_ratings, happy_donor_ratings
  FROM service_requests 
  WHERE fundraiser_id = fundraiser_uuid 
    AND donor_rates_fundraiser IS NOT NULL;

  -- Calculate sent happiness (how this fundraiser rates donors)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE fundraiser_rates_donor = 'happy')
  INTO total_fundraiser_ratings, happy_fundraiser_ratings
  FROM service_requests 
  WHERE fundraiser_id = fundraiser_uuid 
    AND fundraiser_rates_donor IS NOT NULL;

  -- Update user happiness metrics (fundraiser)
  UPDATE users 
  SET 
    received_happiness = CASE 
      WHEN total_donor_ratings > 0 THEN 
        ROUND((happy_donor_ratings::decimal / total_donor_ratings) * 100)
      ELSE NULL 
    END,
    sent_happiness = CASE 
      WHEN total_fundraiser_ratings > 0 THEN 
        ROUND((happy_fundraiser_ratings::decimal / total_fundraiser_ratings) * 100)
      ELSE NULL 
    END
  WHERE id = fundraiser_uuid;
END;
$function$;

-- Function 2: Calculate Donor Happiness
CREATE OR REPLACE FUNCTION public.calculate_donor_happiness(donor_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  total_fundraiser_ratings INTEGER;
  happy_fundraiser_ratings INTEGER;
  total_donor_ratings INTEGER;
  happy_donor_ratings INTEGER;
BEGIN
  -- Calculate received happiness (how fundraisers rate this donor)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE fundraiser_rates_donor = 'happy')
  INTO total_fundraiser_ratings, happy_fundraiser_ratings
  FROM service_requests 
  WHERE donor_id = donor_uuid 
    AND fundraiser_rates_donor IS NOT NULL;

  -- Calculate sent happiness (how this donor rates fundraisers/services)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE donor_rates_fundraiser = 'happy' OR donor_rates_service = 'happy')
  INTO total_donor_ratings, happy_donor_ratings
  FROM service_requests 
  WHERE donor_id = donor_uuid 
    AND (donor_rates_fundraiser IS NOT NULL OR donor_rates_service IS NOT NULL);

  -- Update user happiness metrics (donor)
  UPDATE users 
  SET 
    received_happiness = CASE 
      WHEN total_fundraiser_ratings > 0 THEN 
        ROUND((happy_fundraiser_ratings::decimal / total_fundraiser_ratings) * 100)
      ELSE NULL 
    END,
    sent_happiness = CASE 
      WHEN total_donor_ratings > 0 THEN 
        ROUND((happy_donor_ratings::decimal / total_donor_ratings) * 100)
      ELSE NULL 
    END
  WHERE id = donor_uuid;
END;
$function$;

-- Function 3: Calculate Service Happiness
CREATE OR REPLACE FUNCTION public.calculate_service_happiness(service_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  total_ratings INTEGER;
  happy_ratings INTEGER;
BEGIN
  -- Calculate service happiness rate
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE donor_rates_service = 'happy')
  INTO total_ratings, happy_ratings
  FROM service_requests 
  WHERE service_id = service_uuid 
    AND donor_rates_service IS NOT NULL;

  -- Update service happiness rate
  UPDATE services 
  SET happiness_rate = CASE 
    WHEN total_ratings > 0 THEN 
      ROUND((happy_ratings::decimal / total_ratings) * 100)
    ELSE NULL 
  END
  WHERE id = service_uuid;
END;
$function$;

-- Function 4: Trigger Function for Happiness Updates
CREATE OR REPLACE FUNCTION public.trigger_update_happiness_metrics()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only update if rating fields changed
  IF (OLD.donor_rates_fundraiser IS DISTINCT FROM NEW.donor_rates_fundraiser) OR
     (OLD.fundraiser_rates_donor IS DISTINCT FROM NEW.fundraiser_rates_donor) OR
     (OLD.donor_rates_service IS DISTINCT FROM NEW.donor_rates_service) THEN
    
    -- Update fundraiser happiness
    PERFORM calculate_fundraiser_happiness(NEW.fundraiser_id);
    
    -- Update donor happiness
    PERFORM calculate_donor_happiness(NEW.donor_id);
    
    -- Update service happiness
    PERFORM calculate_service_happiness(NEW.service_id);
  END IF;
  
  RETURN NEW;
END;
$function$;