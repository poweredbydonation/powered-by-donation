-- Migration 002: Dual Platform References Implementation
-- This migration adds support for JustGiving and Every.org platforms
-- with sequential reference generation (PD-JG-1000, PD-EV-1000)

-- ====================
-- ENUMS AND TYPES
-- ====================

-- Platform enum for donation platforms
CREATE TYPE donation_platform AS ENUM ('justgiving', 'every_org');

-- ====================
-- SEQUENCES FOR PLATFORM REFERENCES
-- ====================

-- JustGiving donation references: PD-JG-1000, PD-JG-1001, etc.
CREATE SEQUENCE IF NOT EXISTS donation_reference_jg_seq 
    START WITH 1000 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

-- Every.org donation references: PD-EV-1000, PD-EV-1001, etc.
CREATE SEQUENCE IF NOT EXISTS donation_reference_ev_seq 
    START WITH 1000 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

-- ====================
-- TABLE MODIFICATIONS
-- ====================

-- Add platform preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_platform donation_platform DEFAULT 'justgiving';

-- Add platform field to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS platform donation_platform DEFAULT 'justgiving';
ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_id TEXT; -- Platform-specific charity/nonprofit ID
ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_name TEXT; -- Cached organization name
ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_data JSONB; -- Full platform organization data

-- Update service_requests table for dual platform support
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS platform donation_platform DEFAULT 'justgiving';
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE; -- PD-JG-1000 or PD-EV-1000
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS organization_id TEXT; -- Platform-specific ID
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS organization_name TEXT; -- Cached name
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS donation_url TEXT; -- Generated donation URL
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS external_donation_id TEXT; -- Platform's donation ID after completion
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMPTZ; -- When to timeout pending donations

-- ====================
-- SEPARATE CHARITY CACHE TABLES
-- ====================

-- Rename existing charity_cache to justgiving_charity_cache
ALTER TABLE charity_cache RENAME TO justgiving_charity_cache;

-- Create Every.org nonprofit cache table
CREATE TABLE IF NOT EXISTS every_org_nonprofit_cache (
    nonprofit_ein TEXT PRIMARY KEY, -- Every.org uses EIN as primary identifier
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    logo_url TEXT,
    slug TEXT NOT NULL UNIQUE,
    total_donations_count INTEGER DEFAULT 0,
    total_amount_received DECIMAL DEFAULT 0,
    this_month_count INTEGER DEFAULT 0,
    this_month_amount DECIMAL DEFAULT 0,
    service_categories JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    page_views INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    stats_last_updated TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- REFERENCE GENERATION FUNCTION
-- ====================

CREATE OR REPLACE FUNCTION generate_platform_reference(platform_type donation_platform)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    reference_num INTEGER;
    reference_id TEXT;
BEGIN
    CASE platform_type
        WHEN 'justgiving' THEN
            reference_num := nextval('donation_reference_jg_seq');
            reference_id := 'PD-JG-' || reference_num;
        WHEN 'every_org' THEN
            reference_num := nextval('donation_reference_ev_seq');
            reference_id := 'PD-EV-' || reference_num;
        ELSE
            RAISE EXCEPTION 'Unknown platform type: %', platform_type;
    END CASE;
    
    RETURN reference_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_platform_reference(donation_platform) TO authenticated;

-- ====================
-- INDEXES FOR NEW COLUMNS
-- ====================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_preferred_platform ON users(preferred_platform);

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_platform ON services(platform);
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_platform_active ON services(platform, is_active, show_in_directory);

-- Service request indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_platform ON service_requests(platform);
CREATE INDEX IF NOT EXISTS idx_service_requests_reference_id ON service_requests(reference_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_organization_id ON service_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_timeout ON service_requests(status, timeout_at) WHERE status = 'pending';

-- Every.org nonprofit cache indexes
CREATE INDEX IF NOT EXISTS idx_every_org_nonprofit_cache_slug ON every_org_nonprofit_cache(slug);
CREATE INDEX IF NOT EXISTS idx_every_org_nonprofit_cache_active ON every_org_nonprofit_cache(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_every_org_nonprofit_cache_featured ON every_org_nonprofit_cache(is_featured) WHERE is_featured = true;

-- ====================
-- ROW LEVEL SECURITY POLICIES
-- ====================

-- Enable RLS on new table
ALTER TABLE every_org_nonprofit_cache ENABLE ROW LEVEL SECURITY;

-- Every.org nonprofit cache policies
CREATE POLICY "Public can view every_org nonprofit cache" ON every_org_nonprofit_cache
    FOR SELECT USING (is_active = true);

-- ====================
-- UPDATED VIEWS FOR PLATFORM AWARENESS
-- ====================

-- Update public platform statistics view to be platform-aware
DROP VIEW IF EXISTS public_platform_stats;
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT 
    COUNT(*) as total_services,
    COUNT(DISTINCT user_id) as total_fundraisers,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as services_this_month,
    COUNT(*) FILTER (WHERE platform = 'justgiving') as justgiving_services,
    COUNT(*) FILTER (WHERE platform = 'every_org') as every_org_services
FROM services 
WHERE is_active = true AND show_in_directory = true;

-- Update public donation activity view for platform awareness
DROP VIEW IF EXISTS public_donation_activity;
CREATE OR REPLACE VIEW public_donation_activity AS
SELECT 
    sr.donation_amount,
    s.title as service_title,
    COALESCE(sr.organization_name, jc.name, ec.name) as organization_name,
    sr.platform,
    sr.created_at,
    'Anonymous' as donor_name
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
LEFT JOIN justgiving_charity_cache jc ON sr.organization_id = jc.justgiving_charity_id AND sr.platform = 'justgiving'
LEFT JOIN every_org_nonprofit_cache ec ON sr.organization_id = ec.nonprofit_ein AND sr.platform = 'every_org'
WHERE sr.status IN ('success', 'acknowledged_feedback')
ORDER BY sr.created_at DESC
LIMIT 50;

-- Grant public access to updated views
GRANT SELECT ON public_platform_stats TO public;
GRANT SELECT ON public_donation_activity TO public;

-- ====================
-- UPDATED FUNCTIONS FOR PLATFORM SUPPORT
-- ====================

-- Updated charity public stats function to support both platforms
DROP FUNCTION IF EXISTS get_charity_public_stats(TEXT);
CREATE OR REPLACE FUNCTION get_organization_public_stats(organization_slug TEXT, platform_type donation_platform DEFAULT 'justgiving')
RETURNS TABLE (
    name TEXT,
    description TEXT,
    logo_url TEXT,
    total_donations_count INTEGER,
    total_amount_received DECIMAL,
    this_month_count INTEGER,
    this_month_amount DECIMAL,
    service_categories JSONB,
    platform donation_platform
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
    SELECT 
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.name FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.name FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.description FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.description FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.logo_url FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.logo_url FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.total_donations_count FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.total_donations_count FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.total_amount_received FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.total_amount_received FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.this_month_count FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.this_month_count FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.this_month_amount FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.this_month_amount FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.service_categories FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.service_categories FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        platform_type;
$$;

GRANT EXECUTE ON FUNCTION get_organization_public_stats(TEXT, donation_platform) TO public;

-- ====================
-- MIGRATE EXISTING DATA
-- ====================

-- Update existing service_requests to have reference IDs
UPDATE service_requests 
SET reference_id = generate_platform_reference('justgiving'::donation_platform)
WHERE reference_id IS NULL;

-- Update existing services to have organization data from justgiving_charity_cache
UPDATE services s
SET 
    organization_id = s.preferred_charities->0->>'id',
    organization_name = jc.name,
    organization_data = jsonb_build_object(
        'id', jc.justgiving_charity_id,
        'name', jc.name,
        'description', jc.description,
        'logo_url', jc.logo_url,
        'category', jc.category
    )
FROM justgiving_charity_cache jc
WHERE s.preferred_charities->0->>'id' = jc.justgiving_charity_id
    AND s.organization_id IS NULL;

-- ====================
-- TABLE COMMENTS
-- ====================

COMMENT ON TYPE donation_platform IS 'Supported donation platforms: JustGiving and Every.org';
COMMENT ON SEQUENCE donation_reference_jg_seq IS 'Sequential references for JustGiving donations (PD-JG-1000+)';
COMMENT ON SEQUENCE donation_reference_ev_seq IS 'Sequential references for Every.org donations (PD-EV-1000+)';

COMMENT ON COLUMN users.preferred_platform IS 'User''s preferred donation platform (defaults to JustGiving)';

COMMENT ON COLUMN services.platform IS 'Platform this service uses for donations';
COMMENT ON COLUMN services.organization_id IS 'Platform-specific charity/nonprofit ID';
COMMENT ON COLUMN services.organization_name IS 'Cached organization name for display';
COMMENT ON COLUMN services.organization_data IS 'Full platform organization data (JSON)';

COMMENT ON COLUMN service_requests.platform IS 'Platform used for this donation request';
COMMENT ON COLUMN service_requests.reference_id IS 'Unique platform reference (PD-JG-1000, PD-EV-1000)';
COMMENT ON COLUMN service_requests.organization_id IS 'Platform-specific organization ID';
COMMENT ON COLUMN service_requests.organization_name IS 'Cached organization name';
COMMENT ON COLUMN service_requests.donation_url IS 'Generated donation URL for platform';
COMMENT ON COLUMN service_requests.external_donation_id IS 'Platform''s donation ID after completion';
COMMENT ON COLUMN service_requests.timeout_at IS 'When to timeout pending donations (30min after creation)';

COMMENT ON TABLE justgiving_charity_cache IS 'Cached JustGiving charity data';
COMMENT ON TABLE every_org_nonprofit_cache IS 'Cached Every.org nonprofit data';

COMMENT ON FUNCTION generate_platform_reference(donation_platform) IS 'Generates sequential platform-specific references';
COMMENT ON FUNCTION get_organization_public_stats(TEXT, donation_platform) IS 'Get public organization stats by slug and platform';