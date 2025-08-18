-- Create lookup tables for filter options to improve performance
-- These tables will be populated by cron job from organization_cache data

-- ACNC Categories lookup
CREATE TABLE IF NOT EXISTS acnc_categories_lookup (
  id SERIAL PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACNC Purposes lookup
CREATE TABLE IF NOT EXISTS acnc_purposes_lookup (
  id SERIAL PRIMARY KEY,
  purpose TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACNC Beneficiaries lookup
CREATE TABLE IF NOT EXISTS acnc_beneficiaries_lookup (
  id SERIAL PRIMARY KEY,
  beneficiary TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACNC Cities lookup
CREATE TABLE IF NOT EXISTS acnc_cities_lookup (
  id SERIAL PRIMARY KEY,
  city TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACNC States lookup
CREATE TABLE IF NOT EXISTS acnc_states_lookup (
  id SERIAL PRIMARY KEY,
  state TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACNC Operating Countries lookup
CREATE TABLE IF NOT EXISTS acnc_operating_countries_lookup (
  id SERIAL PRIMARY KEY,
  country TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JustGiving Countries lookup
CREATE TABLE IF NOT EXISTS justgiving_countries_lookup (
  id SERIAL PRIMARY KEY,
  country TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JustGiving Cities lookup
CREATE TABLE IF NOT EXISTS justgiving_cities_lookup (
  id SERIAL PRIMARY KEY,
  city TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Every.org Categories lookup
CREATE TABLE IF NOT EXISTS everyorg_categories_lookup (
  id SERIAL PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  organization_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_acnc_categories_lookup_category ON acnc_categories_lookup(category);
CREATE INDEX IF NOT EXISTS idx_acnc_purposes_lookup_purpose ON acnc_purposes_lookup(purpose);
CREATE INDEX IF NOT EXISTS idx_acnc_beneficiaries_lookup_beneficiary ON acnc_beneficiaries_lookup(beneficiary);
CREATE INDEX IF NOT EXISTS idx_acnc_cities_lookup_city ON acnc_cities_lookup(city);
CREATE INDEX IF NOT EXISTS idx_acnc_states_lookup_state ON acnc_states_lookup(state);
CREATE INDEX IF NOT EXISTS idx_acnc_operating_countries_lookup_country ON acnc_operating_countries_lookup(country);
CREATE INDEX IF NOT EXISTS idx_justgiving_countries_lookup_country ON justgiving_countries_lookup(country);
CREATE INDEX IF NOT EXISTS idx_justgiving_cities_lookup_city ON justgiving_cities_lookup(city);
CREATE INDEX IF NOT EXISTS idx_everyorg_categories_lookup_category ON everyorg_categories_lookup(category);

-- Enable RLS on all lookup tables
ALTER TABLE acnc_categories_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE acnc_purposes_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE acnc_beneficiaries_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE acnc_cities_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE acnc_states_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE acnc_operating_countries_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE justgiving_countries_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE justgiving_cities_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE everyorg_categories_lookup ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all lookup tables (they contain only filter options)
CREATE POLICY "Allow public read access to acnc_categories_lookup" ON acnc_categories_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to acnc_purposes_lookup" ON acnc_purposes_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to acnc_beneficiaries_lookup" ON acnc_beneficiaries_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to acnc_cities_lookup" ON acnc_cities_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to acnc_states_lookup" ON acnc_states_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to acnc_operating_countries_lookup" ON acnc_operating_countries_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to justgiving_countries_lookup" ON justgiving_countries_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to justgiving_cities_lookup" ON justgiving_cities_lookup FOR SELECT USING (true);
CREATE POLICY "Allow public read access to everyorg_categories_lookup" ON everyorg_categories_lookup FOR SELECT USING (true);