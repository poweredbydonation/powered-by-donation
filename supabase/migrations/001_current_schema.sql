-- Migration 001: Current Database Schema
-- This migration represents the complete current state of the Powered by Donation database
-- after the provider→fundraiser & supporter→donor terminology update

-- ====================
-- ENUMS AND TYPES
-- ====================

-- Currency code type
CREATE TYPE currency_code AS ENUM ('GBP', 'USD', 'EUR', 'AUD', 'CAD');

-- ====================
-- CORE TABLES
-- ====================

-- Users table (unified fundraisers and donors)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    is_fundraiser BOOLEAN DEFAULT false,
    is_donor BOOLEAN DEFAULT true,
    bio TEXT,
    location TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_currency currency_code DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing tiers for standardized service pricing
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id SERIAL PRIMARY KEY,
    tier_name TEXT NOT NULL,
    tier_order INTEGER NOT NULL,
    use_case TEXT NOT NULL,
    price_aud DECIMAL NOT NULL,
    price_usd DECIMAL NOT NULL,
    price_eur DECIMAL NOT NULL,
    price_gbp DECIMAL NOT NULL,
    price_cad DECIMAL NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    donation_amount DECIMAL NOT NULL,
    pricing_tier_id INTEGER REFERENCES pricing_tiers(id),
    charity_requirement_type TEXT NOT NULL,
    preferred_charities JSONB,
    available_from DATE NOT NULL,
    available_until DATE,
    max_donors INTEGER,
    current_donors INTEGER DEFAULT 0,
    service_locations JSONB NOT NULL,
    show_in_directory BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Service requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID REFERENCES users(id),
    fundraiser_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    justgiving_charity_id TEXT NOT NULL,
    donation_amount DECIMAL NOT NULL,
    charity_name TEXT,
    status TEXT DEFAULT 'pending',
    donor_satisfaction TEXT,
    fundraiser_feedback_response TEXT,
    satisfaction_check_sent_at TIMESTAMPTZ,
    donor_responded_at TIMESTAMPTZ,
    fundraiser_feedback_sent_at TIMESTAMPTZ,
    fundraiser_responded_at TIMESTAMPTZ,
    fundraiser_rates_donor TEXT,
    donor_rates_fundraiser TEXT,
    donor_rates_service TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Charity cache table
CREATE TABLE IF NOT EXISTS charity_cache (
    justgiving_charity_id TEXT PRIMARY KEY,
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

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- CONSTRAINTS
-- ====================

-- Service request constraints
ALTER TABLE service_requests ADD CONSTRAINT IF NOT EXISTS service_requests_donor_satisfaction_check 
    CHECK (donor_satisfaction IN ('happy', 'unhappy', 'timeout'));

ALTER TABLE service_requests ADD CONSTRAINT IF NOT EXISTS service_requests_fundraiser_feedback_response_check 
    CHECK (fundraiser_feedback_response IN ('will_improve', 'disagree', 'timeout'));

ALTER TABLE service_requests ADD CONSTRAINT IF NOT EXISTS service_requests_fundraiser_rates_donor_check 
    CHECK (fundraiser_rates_donor IN ('happy', 'unhappy'));

ALTER TABLE service_requests ADD CONSTRAINT IF NOT EXISTS service_requests_donor_rates_fundraiser_check 
    CHECK (donor_rates_fundraiser IN ('happy', 'unhappy'));

ALTER TABLE service_requests ADD CONSTRAINT IF NOT EXISTS service_requests_donor_rates_service_check 
    CHECK (donor_rates_service IN ('happy', 'unhappy'));

-- ====================
-- INDEXES
-- ====================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_is_fundraiser ON users(is_fundraiser) WHERE is_fundraiser = true;
CREATE INDEX IF NOT EXISTS idx_users_is_donor ON users(is_donor) WHERE is_donor = true;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_active_directory ON services(is_active, show_in_directory);
CREATE INDEX IF NOT EXISTS idx_services_available_dates ON services(available_from, available_until);

-- Service request indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_donor_id ON service_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_fundraiser_id ON service_requests(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_charity ON service_requests(justgiving_charity_id);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_cache ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated can create user profiles" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Service policies
CREATE POLICY "Public can view active services" ON services
    FOR SELECT USING (is_active = true AND show_in_directory = true);

CREATE POLICY "Users can manage their own services" ON services
    FOR ALL USING (auth.uid() = user_id);

-- Service request policies
CREATE POLICY "Users can view their own service requests as donor" ON service_requests
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Users can view their own service requests as fundraiser" ON service_requests
    FOR SELECT USING (fundraiser_id = auth.uid());

CREATE POLICY "Donors can insert service requests" ON service_requests
    FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Users can update their own service requests as donor" ON service_requests
    FOR UPDATE USING (donor_id = auth.uid()) WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Users can update their own service requests as fundraiser" ON service_requests
    FOR UPDATE USING (fundraiser_id = auth.uid()) WITH CHECK (fundraiser_id = auth.uid());

-- Charity cache policies
CREATE POLICY "Public can view charity cache" ON charity_cache
    FOR SELECT USING (is_active = true);

-- ====================
-- FUNCTIONS AND VIEWS
-- ====================

-- Public platform statistics view (anonymous aggregate data)
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT 
    COUNT(*) as total_services,
    COUNT(DISTINCT user_id) as total_fundraisers,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as services_this_month
FROM services 
WHERE is_active = true AND show_in_directory = true;

-- Public donation activity view (anonymous)
CREATE OR REPLACE VIEW public_donation_activity AS
SELECT 
    sr.donation_amount,
    s.title as service_title,
    cc.name as charity_name,
    sr.created_at,
    'Anonymous' as donor_name
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
JOIN charity_cache cc ON sr.justgiving_charity_id = cc.justgiving_charity_id
WHERE sr.status IN ('success', 'acknowledged_feedback')
ORDER BY sr.created_at DESC
LIMIT 50;

-- Grant public access to views
GRANT SELECT ON public_platform_stats TO public;
GRANT SELECT ON public_donation_activity TO public;

-- Function for charity public stats
CREATE OR REPLACE FUNCTION get_charity_public_stats(charity_slug TEXT)
RETURNS TABLE (
    name TEXT,
    description TEXT,
    logo_url TEXT,
    total_donations_count INTEGER,
    total_amount_received DECIMAL,
    this_month_count INTEGER,
    this_month_amount DECIMAL,
    service_categories JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION get_charity_public_stats(TEXT) TO public;

-- ====================
-- TABLE COMMENTS
-- ====================

COMMENT ON TABLE users IS 'Unified users table combining fundraisers and donors';
COMMENT ON COLUMN users.is_fundraiser IS 'True if user offers services';
COMMENT ON COLUMN users.is_donor IS 'True if user can make donations - default';

COMMENT ON TABLE services IS 'Services offered by fundraiser users';
COMMENT ON COLUMN services.user_id IS 'References users table (must be a fundraiser)';
COMMENT ON COLUMN services.max_donors IS 'Maximum number of donors for this service';
COMMENT ON COLUMN services.current_donors IS 'Current number of donors for this service';

COMMENT ON TABLE service_requests IS 'Donation requests between donors and fundraisers';
COMMENT ON COLUMN service_requests.donor_id IS 'User making the donation';
COMMENT ON COLUMN service_requests.fundraiser_id IS 'User providing the service';
COMMENT ON COLUMN service_requests.donor_satisfaction IS 'Donor satisfaction rating';
COMMENT ON COLUMN service_requests.fundraiser_feedback_response IS 'Fundraiser response to feedback';
COMMENT ON COLUMN service_requests.donor_responded_at IS 'When donor responded to satisfaction check';
COMMENT ON COLUMN service_requests.fundraiser_feedback_sent_at IS 'When fundraiser feedback was sent';
COMMENT ON COLUMN service_requests.fundraiser_responded_at IS 'When fundraiser responded';
COMMENT ON COLUMN service_requests.fundraiser_rates_donor IS 'Fundraiser rating of donor experience';
COMMENT ON COLUMN service_requests.donor_rates_fundraiser IS 'Donor rating of fundraiser experience';
COMMENT ON COLUMN service_requests.donor_rates_service IS 'Donor rating of service quality';