-- Create unified organization_cache table for Platform-First restructuring
-- This replaces both justgiving_charity_cache and every_org_nonprofit_cache

-- First, create the donation_platform enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_platform') THEN
        CREATE TYPE donation_platform AS ENUM ('justgiving', 'every_org');
    END IF;
END $$;

-- Create the unified organization_cache table
CREATE TABLE public.organization_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform donation_platform NOT NULL,
  external_id text NOT NULL, -- justgiving_charity_id or nonprofit_ein
  name text NOT NULL,
  description text,
  category text,
  logo_url text,
  slug text NOT NULL,
  
  -- Donation stats (common to both platforms)
  total_donations_count integer DEFAULT 0,
  total_amount_received numeric DEFAULT 0,
  this_month_count integer DEFAULT 0,
  this_month_amount numeric DEFAULT 0,
  service_categories jsonb DEFAULT '{}'::jsonb,
  
  -- Platform management
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  page_views integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  stats_last_updated timestamp with time zone DEFAULT now(),
  
  -- Enhanced details (primarily from JustGiving)
  address_line1 text,
  address_line2 text,
  address_city text,
  address_county text,
  address_country text,
  address_postcode text,
  display_name text,
  logo_absolute_url text,
  profile_page_url text,
  registration_number text,
  website_url text,
  email_address text,
  keywords text,
  
  -- JustGiving specific fields
  page_short_name text,
  sms_short_name text,
  is_approved boolean DEFAULT false,
  show_in_search boolean DEFAULT true,
  date_added_to_justgiving timestamp with time zone,
  thankyou_message text,
  impact_statement_what text,
  impact_statement_why text,
  country_code text DEFAULT 'GB'::text,
  currency_code text DEFAULT 'GBP'::text,
  mobile_appeals jsonb,
  donation_display_amounts jsonb,
  theme_colour jsonb,
  categories_list jsonb,
  
  -- API management
  enhanced_data_fetched_at timestamp with time zone,
  api_fetch_attempts integer DEFAULT 0,
  
  -- Full text search
  fts tsvector,
  
  -- Constraints
  CONSTRAINT organization_cache_pkey PRIMARY KEY (id),
  CONSTRAINT organization_cache_platform_external_id_unique UNIQUE (platform, external_id),
  CONSTRAINT organization_cache_platform_slug_unique UNIQUE (platform, slug)
);

-- Create indexes for performance
CREATE INDEX idx_organization_cache_platform ON organization_cache (platform);
CREATE INDEX idx_organization_cache_slug ON organization_cache (slug);
CREATE INDEX idx_organization_cache_external_id ON organization_cache (external_id);
CREATE INDEX idx_organization_cache_category ON organization_cache (category);
CREATE INDEX idx_organization_cache_is_active ON organization_cache (is_active);
CREATE INDEX idx_organization_cache_is_featured ON organization_cache (is_featured);
CREATE INDEX idx_organization_cache_address_city ON organization_cache (address_city);
CREATE INDEX idx_organization_cache_country_code ON organization_cache (country_code);
CREATE INDEX idx_organization_cache_fts ON organization_cache USING GIN (fts);

-- Create composite indexes for common queries
CREATE INDEX idx_organization_cache_platform_active ON organization_cache (platform, is_active);
CREATE INDEX idx_organization_cache_platform_category ON organization_cache (platform, category);
CREATE INDEX idx_organization_cache_platform_city ON organization_cache (platform, address_city);

-- Enable RLS
ALTER TABLE organization_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to organization_cache" ON organization_cache
  FOR SELECT USING (true);

-- Create policy for service worker to update stats
CREATE POLICY "Allow service role to manage organization_cache" ON organization_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update full text search vector
CREATE OR REPLACE FUNCTION update_organization_cache_fts()
RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.display_name, '') || ' ' ||
    COALESCE(NEW.keywords, '') || ' ' ||
    COALESCE(NEW.address_city, '') || ' ' ||
    COALESCE(NEW.address_county, '') || ' ' ||
    COALESCE(NEW.address_country, '') || ' ' ||
    COALESCE(NEW.registration_number, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for FTS updates
CREATE TRIGGER trigger_update_organization_cache_fts
  BEFORE INSERT OR UPDATE ON organization_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_cache_fts();

-- Add comment for documentation
COMMENT ON TABLE organization_cache IS 'Unified cache table for organizations from all donation platforms (JustGiving, Every.org). Replaces platform-specific cache tables.';
COMMENT ON COLUMN organization_cache.platform IS 'Donation platform: justgiving or everyorg';
COMMENT ON COLUMN organization_cache.external_id IS 'Platform-specific ID (justgiving_charity_id or nonprofit_ein)';
COMMENT ON COLUMN organization_cache.slug IS 'URL-friendly unique identifier for the organization within its platform';