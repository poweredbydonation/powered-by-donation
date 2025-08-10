-- Add performance indexes for justgiving_charity_cache table
-- These indexes support common query patterns on the browse charities page

-- Index for sorting by name (most common sort)
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_name ON justgiving_charity_cache(name);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_category ON justgiving_charity_cache(category);

-- Index for country filtering (enhanced data)
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_country ON justgiving_charity_cache(address_country);

-- Index for country code filtering (basic data)
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_country_code ON justgiving_charity_cache(country_code);

-- Index for city filtering
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_city ON justgiving_charity_cache(address_city);

-- Index for approval status filtering
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_approved ON justgiving_charity_cache(is_approved) WHERE is_approved = true;

-- Index for enhanced data filtering
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_enhanced ON justgiving_charity_cache(enhanced_data_fetched_at) WHERE enhanced_data_fetched_at IS NOT NULL;

-- Index for registration number filtering (for registered charities)
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_registration ON justgiving_charity_cache(registration_number) WHERE registration_number IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_active_approved ON justgiving_charity_cache(is_active, is_approved);

-- Add full-text search column and populate it
ALTER TABLE justgiving_charity_cache ADD COLUMN IF NOT EXISTS fts tsvector;

-- Create function to update FTS column
CREATE OR REPLACE FUNCTION update_charity_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    coalesce(NEW.name, '') || ' ' || 
    coalesce(NEW.description, '') || ' ' || 
    coalesce(NEW.keywords, '') || ' ' || 
    coalesce(NEW.address_city, '') || ' ' ||
    coalesce(NEW.registration_number, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update FTS on insert/update
CREATE TRIGGER trigger_charity_fts_update
  BEFORE INSERT OR UPDATE ON justgiving_charity_cache
  FOR EACH ROW EXECUTE FUNCTION update_charity_fts();

-- Populate FTS for existing records
UPDATE justgiving_charity_cache SET fts = to_tsvector('english', 
  coalesce(name, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(keywords, '') || ' ' || 
  coalesce(address_city, '') || ' ' ||
  coalesce(registration_number, '')
);

-- Text search index for full-text search
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_fts ON justgiving_charity_cache USING gin(fts);

-- Index for charity statistics (for performance metrics)
CREATE INDEX IF NOT EXISTS idx_justgiving_charity_cache_stats ON justgiving_charity_cache(total_donations_count, total_amount_received);

-- Comments explaining the indexing strategy
COMMENT ON INDEX idx_justgiving_charity_cache_name IS 'Supports ORDER BY name queries';
COMMENT ON INDEX idx_justgiving_charity_cache_category IS 'Supports category filtering';
COMMENT ON INDEX idx_justgiving_charity_cache_country IS 'Supports enhanced data country filtering';
COMMENT ON INDEX idx_justgiving_charity_cache_country_code IS 'Supports basic country code filtering';
COMMENT ON INDEX idx_justgiving_charity_cache_text_search IS 'Supports full-text search across name, description, keywords, and location';