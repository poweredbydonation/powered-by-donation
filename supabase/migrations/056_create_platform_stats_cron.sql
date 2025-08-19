-- Create function to update platform statistics
CREATE OR REPLACE FUNCTION public.update_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_services_count INTEGER;
    v_justgiving_count INTEGER;
    v_everyorg_count INTEGER;
    v_acnc_count INTEGER;
BEGIN
    -- Count active services
    SELECT COUNT(*)
    INTO v_services_count
    FROM services
    WHERE is_active = true;

    -- Count active JustGiving organizations that should show on platform
    SELECT COUNT(*)
    INTO v_justgiving_count
    FROM organization_cache
    WHERE platform = 'justgiving'
      AND is_active = true
      AND show_on_platform = true;

    -- Count active Every.org organizations that should show on platform
    SELECT COUNT(*)
    INTO v_everyorg_count
    FROM organization_cache
    WHERE platform = 'everyorg'
      AND is_active = true
      AND show_on_platform = true;

    -- Count active ACNC organizations that should show on platform
    SELECT COUNT(*)
    INTO v_acnc_count
    FROM organization_cache
    WHERE platform = 'acnc'
      AND is_active = true
      AND show_on_platform = true;

    -- Update the stats table (should only have one row)
    UPDATE platform_stats 
    SET 
        services_count = v_services_count,
        justgiving_count = v_justgiving_count,
        everyorg_count = v_everyorg_count,
        acnc_count = v_acnc_count,
        last_updated = NOW()
    WHERE id = 1;

    -- If no row exists, insert one
    IF NOT FOUND THEN
        INSERT INTO platform_stats (id, services_count, justgiving_count, everyorg_count, acnc_count)
        VALUES (1, v_services_count, v_justgiving_count, v_everyorg_count, v_acnc_count);
    END IF;

    -- Log the update
    RAISE NOTICE 'Platform stats updated: Services=%, JustGiving=%, Every.org=%, ACNC=%', 
        v_services_count, v_justgiving_count, v_everyorg_count, v_acnc_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.update_platform_stats() TO service_role;

-- Create cron job to run daily at 2 AM UTC
SELECT cron.schedule(
    'update-platform-stats',
    '0 2 * * *', -- Daily at 2 AM UTC
    'SELECT public.update_platform_stats();'
);

-- Run the function once to populate initial data
SELECT public.update_platform_stats();