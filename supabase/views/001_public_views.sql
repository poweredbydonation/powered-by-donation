-- Public Views: Anonymous aggregate data for platform statistics
-- These views provide anonymous access to platform metrics and donation activity
-- Updated for fundraiser/donor terminology and unified user system

-- ====================
-- PLATFORM STATISTICS VIEW
-- ====================

-- Public platform statistics (anonymous aggregate data)
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT 
    COUNT(*) as total_services,
    COUNT(DISTINCT user_id) as total_fundraisers,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as services_this_month
FROM services 
WHERE is_active = true AND show_in_directory = true;

-- Grant public access
GRANT SELECT ON public_platform_stats TO public;

-- ====================
-- DONATION ACTIVITY VIEW
-- ====================

-- Public donation activity view (anonymous)
CREATE OR REPLACE VIEW public_donation_activity AS
SELECT 
    sr.donation_amount,
    s.title as service_title,
    cc.name as charity_name,
    sr.created_at,
    'Anonymous' as donor_name  -- Always anonymous per privacy model
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
JOIN charity_cache cc ON sr.justgiving_charity_id = cc.justgiving_charity_id
WHERE sr.status IN ('success', 'acknowledged_feedback')
ORDER BY sr.created_at DESC
LIMIT 50;

-- Grant public access
GRANT SELECT ON public_donation_activity TO public;

-- ====================
-- FUNDRAISER ACTIVITY VIEW
-- ====================

-- Aggregate fundraiser activity (no personal data)
CREATE OR REPLACE VIEW public_fundraiser_activity AS
SELECT 
    COUNT(DISTINCT s.user_id) as total_fundraisers,
    COUNT(s.id) as total_services,
    SUM(s.donation_amount) as total_potential_donations,
    COUNT(s.id) FILTER (WHERE s.created_at >= date_trunc('month', NOW())) as new_services_this_month,
    AVG(s.happiness_rate) as average_service_rating
FROM services s
WHERE s.is_active = true AND s.show_in_directory = true;

-- Grant public access
GRANT SELECT ON public_fundraiser_activity TO public;

-- ====================
-- CHARITY IMPACT VIEW
-- ====================

-- Charity impact statistics (anonymous)
CREATE OR REPLACE VIEW public_charity_impact AS
SELECT 
    cc.name as charity_name,
    cc.slug as charity_slug,
    cc.total_donations_count,
    cc.total_amount_received,
    cc.this_month_count,
    cc.this_month_amount,
    cc.service_categories
FROM charity_cache cc
WHERE cc.is_active = true
ORDER BY cc.total_amount_received DESC;

-- Grant public access
GRANT SELECT ON public_charity_impact TO public;