-- Update happiness calculation functions for new workflow rating system
-- Replace old text-based ratings with new enum-based system

-- Update calculate_donor_happiness function
CREATE OR REPLACE FUNCTION public.calculate_donor_happiness(donor_uuid uuid)
RETURNS void
LANGUAGE plpgsql 
SET search_path = public
AS $$
DECLARE
    total_fundraiser_ratings INTEGER;
    happy_fundraiser_ratings INTEGER;
    total_donor_ratings INTEGER;
    happy_donor_ratings INTEGER;
BEGIN
    -- Calculate received happiness (how fundraisers rate this donor)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE fundraiser_donor_rating = 'Great')
    INTO total_fundraiser_ratings, happy_fundraiser_ratings
    FROM service_requests
    WHERE donor_id = donor_uuid
      AND fundraiser_donor_rating IS NOT NULL
      AND workflow_status = 'service_feedback_recorded';

    -- Calculate sent happiness (how this donor rates services)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE donor_service_rating = 'Great')
    INTO total_donor_ratings, happy_donor_ratings
    FROM service_requests
    WHERE donor_id = donor_uuid
      AND donor_service_rating IS NOT NULL
      AND workflow_status = 'service_feedback_recorded';

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
$$;

-- Update calculate_fundraiser_happiness function
CREATE OR REPLACE FUNCTION public.calculate_fundraiser_happiness(fundraiser_uuid uuid)
RETURNS void
LANGUAGE plpgsql 
SET search_path = public
AS $$
DECLARE
    total_donor_ratings INTEGER;
    happy_donor_ratings INTEGER;
    total_fundraiser_ratings INTEGER;
    happy_fundraiser_ratings INTEGER;
BEGIN
    -- Calculate received happiness (how donors rate this fundraiser's services)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE donor_service_rating = 'Great')
    INTO total_donor_ratings, happy_donor_ratings
    FROM service_requests
    WHERE fundraiser_id = fundraiser_uuid
      AND donor_service_rating IS NOT NULL
      AND workflow_status = 'service_feedback_recorded';

    -- Calculate sent happiness (how this fundraiser rates donors)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE fundraiser_donor_rating = 'Great')
    INTO total_fundraiser_ratings, happy_fundraiser_ratings
    FROM service_requests
    WHERE fundraiser_id = fundraiser_uuid
      AND fundraiser_donor_rating IS NOT NULL
      AND workflow_status = 'service_feedback_recorded';

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
$$;

-- Update calculate_service_happiness function
CREATE OR REPLACE FUNCTION public.calculate_service_happiness(service_uuid uuid)
RETURNS void
LANGUAGE plpgsql 
SET search_path = public
AS $$
DECLARE
    total_ratings INTEGER;
    happy_ratings INTEGER;
BEGIN
    -- Calculate service happiness rate (how donors rate this service)
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE donor_service_rating = 'Great')
    INTO total_ratings, happy_ratings
    FROM service_requests
    WHERE service_id = service_uuid
      AND donor_service_rating IS NOT NULL
      AND workflow_status = 'service_feedback_recorded';

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

-- Update the trigger function for automatic happiness updates
CREATE OR REPLACE FUNCTION public.trigger_update_happiness_metrics()
RETURNS trigger
LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
    -- Only update if rating fields changed or workflow completed
    IF (OLD.donor_service_rating IS DISTINCT FROM NEW.donor_service_rating) OR
       (OLD.fundraiser_donor_rating IS DISTINCT FROM NEW.fundraiser_donor_rating) OR
       (OLD.workflow_status IS DISTINCT FROM NEW.workflow_status AND NEW.workflow_status = 'service_feedback_recorded') THEN

        -- Update fundraiser happiness
        PERFORM calculate_fundraiser_happiness(NEW.fundraiser_id);

        -- Update donor happiness
        PERFORM calculate_donor_happiness(NEW.donor_id);

        -- Update service happiness
        PERFORM calculate_service_happiness(NEW.service_id);
    END IF;

    RETURN NEW;
END;
$$;

-- Ensure trigger exists and is updated
DROP TRIGGER IF EXISTS trigger_update_happiness_metrics_on_service_requests ON service_requests;
CREATE TRIGGER trigger_update_happiness_metrics_on_service_requests
    AFTER INSERT OR UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_happiness_metrics();

COMMENT ON FUNCTION public.calculate_donor_happiness(uuid) IS 'Calculate happiness metrics for donor using new workflow rating system';
COMMENT ON FUNCTION public.calculate_fundraiser_happiness(uuid) IS 'Calculate happiness metrics for fundraiser using new workflow rating system';  
COMMENT ON FUNCTION public.calculate_service_happiness(uuid) IS 'Calculate happiness metrics for service using new workflow rating system';
COMMENT ON FUNCTION public.trigger_update_happiness_metrics() IS 'Trigger function for automatic happiness updates with workflow system';