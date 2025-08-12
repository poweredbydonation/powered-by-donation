-- Performance optimization indexes for Platform-First architecture
-- Optimized for new query patterns in organization browsing and filtering

-- Additional composite indexes for Platform-First query patterns

-- Index for platform + location + category filtering (common browse pattern)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_city_category 
ON organization_cache (platform, address_city, category) 
WHERE is_active = true;

-- Index for platform + featured + active (homepage queries)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_featured_active 
ON organization_cache (platform, is_featured, is_active, total_donations_count DESC);

-- Index for preferred charity lookups (services integration)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_external_id_active 
ON organization_cache (platform, external_id, is_active);

-- Index for country-based filtering (location expansion)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_country_active 
ON organization_cache (platform, country_code, is_active) 
WHERE country_code IS NOT NULL;

-- Index for search + platform combination (search performance)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_search_active 
ON organization_cache (platform, is_active) 
WHERE fts IS NOT NULL;

-- Index for stats-based sorting (popular organizations)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_stats 
ON organization_cache (platform, is_active, total_donations_count DESC, this_month_count DESC)
WHERE total_donations_count > 0;

-- Partial index for enhanced data availability (JustGiving specific)
CREATE INDEX IF NOT EXISTS idx_organization_cache_enhanced_data 
ON organization_cache (platform, enhanced_data_fetched_at DESC) 
WHERE platform = 'justgiving' AND enhanced_data_fetched_at IS NOT NULL;

-- Index for API retry logic (background processing)
CREATE INDEX IF NOT EXISTS idx_organization_cache_api_processing 
ON organization_cache (platform, api_fetch_attempts, last_updated) 
WHERE enhanced_data_fetched_at IS NULL AND api_fetch_attempts < 3;

-- Update table statistics for query planner optimization
ANALYZE organization_cache;

-- Log index creation
DO $$
DECLARE
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE tablename = 'organization_cache';
  
  RAISE NOTICE 'Performance optimization completed:';
  RAISE NOTICE '  Total indexes on organization_cache: %', index_count;
  RAISE NOTICE '  Query patterns optimized: platform filtering, location search, preferred lookups, stats sorting';
END $$;