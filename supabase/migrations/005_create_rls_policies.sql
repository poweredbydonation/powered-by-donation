-- Migration 005: Row Level Security (RLS) Policies
-- Based on CLAUDE.md privacy model: Anonymous + Aggregate + Optional Sharing

-- Enable RLS on all tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_cache ENABLE ROW LEVEL SECURITY;

-- ===== CHARITY CACHE POLICIES =====
-- Public read access for charity pages (anonymous + aggregate only)
CREATE POLICY "Public can view charity cache"
ON charity_cache FOR SELECT
TO public
USING (is_active = true);

-- Only authenticated users can insert/update charity data
CREATE POLICY "Authenticated can manage charity cache"
ON charity_cache FOR ALL
TO authenticated
USING (true);

-- ===== PROVIDER POLICIES =====
-- Public can view providers who show in directory
CREATE POLICY "Public can view public providers"
ON providers FOR SELECT
TO public
USING (show_in_directory = true);

-- Providers can view and update their own data
CREATE POLICY "Providers can manage own data"
ON providers FOR ALL
TO authenticated
USING (auth.uid()::text = id::text);

-- Authenticated users can create provider profiles
CREATE POLICY "Authenticated can create provider profiles"
ON providers FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

-- ===== SUPPORTER POLICIES =====
-- Public can view supporters who show in directory (very limited)
CREATE POLICY "Public can view public supporters"
ON supporters FOR SELECT
TO public
USING (show_in_directory = true);

-- Supporters can view and update their own data
CREATE POLICY "Supporters can manage own data"
ON supporters FOR ALL
TO authenticated
USING (auth.uid()::text = id::text);

-- Authenticated users can create supporter profiles
CREATE POLICY "Authenticated can create supporter profiles"
ON supporters FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

-- ===== SERVICES POLICIES =====
-- Public can view active services in directory (for browsing)
CREATE POLICY "Public can view active services"
ON services FOR SELECT
TO public
USING (is_active = true AND show_in_directory = true);

-- Providers can manage their own services
CREATE POLICY "Providers can manage own services"
ON services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM providers 
    WHERE providers.id = services.provider_id 
    AND providers.id::text = auth.uid()::text
  )
);

-- Authenticated users can create services (if they have provider profile)
CREATE POLICY "Authenticated providers can create services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM providers 
    WHERE providers.id = services.provider_id 
    AND providers.id::text = auth.uid()::text
  )
);

-- ===== SERVICE REQUESTS POLICIES =====
-- Anonymous public can view aggregate data only (for platform stats)
-- Individual requests are private - only parties involved can see them

-- Supporters can view their own service requests
CREATE POLICY "Supporters can view own requests"
ON service_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM supporters 
    WHERE supporters.id = service_requests.supporter_id 
    AND supporters.id::text = auth.uid()::text
  )
);

-- Providers can view requests for their services
CREATE POLICY "Providers can view requests for their services"
ON service_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM providers 
    WHERE providers.id = service_requests.provider_id 
    AND providers.id::text = auth.uid()::text
  )
);

-- Supporters can create service requests
CREATE POLICY "Supporters can create service requests"
ON service_requests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supporters 
    WHERE supporters.id = service_requests.supporter_id 
    AND supporters.id::text = auth.uid()::text
  )
);

-- Both providers and supporters can update requests (for feedback)
CREATE POLICY "Providers can update own service requests"
ON service_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM providers 
    WHERE providers.id = service_requests.provider_id 
    AND providers.id::text = auth.uid()::text
  )
);

CREATE POLICY "Supporters can update own service requests"
ON service_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM supporters 
    WHERE supporters.id = service_requests.supporter_id 
    AND supporters.id::text = auth.uid()::text
  )
);

-- ===== SPECIAL POLICIES FOR AGGREGATE DATA =====
-- Create a view for anonymous platform statistics (no personal data)
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT 
  COUNT(*) as total_services,
  COUNT(DISTINCT provider_id) as total_providers,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as services_this_month
FROM services 
WHERE is_active = true AND show_in_directory = true;

-- Create a view for anonymous donation activity (no donor info)
CREATE OR REPLACE VIEW public_donation_activity AS
SELECT 
  sr.donation_amount,
  s.title as service_title,
  cc.name as charity_name,
  sr.created_at,
  -- NO personal information included
  'Anonymous' as donor_name
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
JOIN charity_cache cc ON sr.justgiving_charity_id = cc.justgiving_charity_id
WHERE sr.status IN ('success', 'acknowledged_feedback')
ORDER BY sr.created_at DESC
LIMIT 50;

-- Grant public access to these aggregate views
GRANT SELECT ON public_platform_stats TO public;
GRANT SELECT ON public_donation_activity TO public;

-- ===== FUNCTIONS FOR PRIVACY-SAFE OPERATIONS =====
-- Function to get charity stats without exposing personal data
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

-- Grant execute permission to public for charity stats
GRANT EXECUTE ON FUNCTION get_charity_public_stats(TEXT) TO public;