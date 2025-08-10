-- Fix Supabase security linter issues
-- 1. Enable RLS on exchange_rates table
-- 2. Remove SECURITY DEFINER from public views and recreate them properly

-- Enable RLS on exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for exchange_rates (read-only for authenticated users)
DO $$ BEGIN
    CREATE POLICY "Exchange rates are readable by authenticated users" ON exchange_rates
        FOR SELECT 
        TO authenticated
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create RLS policy for exchange_rates (public read access for current rates)  
DO $$ BEGIN
    CREATE POLICY "Exchange rates are publicly readable" ON exchange_rates
        FOR SELECT 
        TO public
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public_platform_stats CASCADE;
DROP VIEW IF EXISTS public_donation_activity CASCADE;

-- Recreate public_platform_stats view explicitly WITHOUT SECURITY DEFINER
CREATE VIEW public_platform_stats 
WITH (security_invoker = true) AS
SELECT 
    COUNT(*) as total_services,
    COUNT(DISTINCT user_id) as total_fundraisers,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as services_this_month
FROM services 
WHERE is_active = true AND show_in_directory = true;

-- Recreate public_donation_activity view explicitly WITHOUT SECURITY DEFINER  
CREATE VIEW public_donation_activity 
WITH (security_invoker = true) AS
SELECT 
    sr.donation_amount,
    s.title as service_title,
    cc.name as charity_name,
    sr.created_at,
    'Anonymous' as donor_name
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
JOIN justgiving_charity_cache cc ON sr.justgiving_charity_id = cc.justgiving_charity_id
WHERE sr.status IN ('success', 'acknowledged_feedback')
ORDER BY sr.created_at DESC
LIMIT 50;

-- Grant public access to views
GRANT SELECT ON public_platform_stats TO public;
GRANT SELECT ON public_donation_activity TO public;

-- Add comment explaining the security approach
COMMENT ON VIEW public_platform_stats IS 'Public aggregate statistics - uses caller permissions, not SECURITY DEFINER';
COMMENT ON VIEW public_donation_activity IS 'Public anonymous donation activity - uses caller permissions, not SECURITY DEFINER';
COMMENT ON TABLE exchange_rates IS 'Exchange rates table with RLS enabled for security compliance';