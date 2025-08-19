-- Add indexes for comprehensive filtering combinations
-- Category → State → Purpose → Location → Beneficiaries → Operating Countries

-- 1. Category filtering (enhance existing single category index)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_category_active 
ON organization_cache (platform, category, is_active) 
WHERE category IS NOT NULL;

-- 2. Category + State filtering  
CREATE INDEX IF NOT EXISTS idx_organization_cache_category_state 
ON organization_cache (
  platform, 
  category,
  acnc_operates_in_nsw,
  acnc_operates_in_vic,
  acnc_operates_in_qld,
  acnc_operates_in_sa,
  acnc_operates_in_wa,
  acnc_operates_in_tas,
  acnc_operates_in_nt,
  acnc_operates_in_act,
  is_active
) 
WHERE platform = 'justgiving' AND category IS NOT NULL;

-- 3. State filtering (comprehensive all states)
CREATE INDEX IF NOT EXISTS idx_organization_cache_all_states_active 
ON organization_cache (
  platform,
  acnc_operates_in_nsw,
  acnc_operates_in_vic,
  acnc_operates_in_qld,
  acnc_operates_in_sa,
  acnc_operates_in_wa,
  acnc_operates_in_tas,
  acnc_operates_in_nt,
  acnc_operates_in_act,
  is_active
) 
WHERE platform = 'justgiving';

-- 4. Purpose filtering (JSONB GIN index)
CREATE INDEX IF NOT EXISTS idx_organization_cache_purposes_gin 
ON organization_cache USING GIN (acnc_purposes) 
WHERE platform = 'justgiving' AND acnc_purposes IS NOT NULL;

-- 5. State + Purpose filtering (hybrid approach)
CREATE INDEX IF NOT EXISTS idx_organization_cache_state_purpose 
ON organization_cache (
  platform,
  acnc_operates_in_nsw,
  acnc_operates_in_vic,
  acnc_operates_in_qld,
  is_active
) 
WHERE platform = 'justgiving' AND acnc_purposes IS NOT NULL;

-- 6. Location filtering (address-based)
CREATE INDEX IF NOT EXISTS idx_organization_cache_location_comprehensive 
ON organization_cache (
  platform,
  address_city,
  address_county, 
  address_country,
  country_code,
  is_active
) 
WHERE address_city IS NOT NULL;

-- 7. Purpose + Location filtering
CREATE INDEX IF NOT EXISTS idx_organization_cache_purpose_location 
ON organization_cache (
  platform,
  address_city,
  country_code,
  is_active
) 
WHERE platform = 'justgiving' AND acnc_purposes IS NOT NULL AND address_city IS NOT NULL;

-- 8. Beneficiaries filtering (JSONB GIN index)
CREATE INDEX IF NOT EXISTS idx_organization_cache_beneficiaries_gin 
ON organization_cache USING GIN (acnc_beneficiaries) 
WHERE platform = 'justgiving' AND acnc_beneficiaries IS NOT NULL;

-- 9. Location + Beneficiaries filtering
CREATE INDEX IF NOT EXISTS idx_organization_cache_location_beneficiaries 
ON organization_cache (
  platform,
  address_city,
  address_country,
  is_active
) 
WHERE platform = 'justgiving' AND acnc_beneficiaries IS NOT NULL;

-- 10. Operating Countries filtering
CREATE INDEX IF NOT EXISTS idx_organization_cache_operating_countries 
ON organization_cache (platform, acnc_operating_countries, is_active) 
WHERE platform = 'justgiving' AND acnc_operating_countries IS NOT NULL;

-- 11. Beneficiaries + Operating Countries filtering  
CREATE INDEX IF NOT EXISTS idx_organization_cache_beneficiaries_countries 
ON organization_cache (platform, acnc_operating_countries, is_active) 
WHERE platform = 'justgiving' 
  AND acnc_beneficiaries IS NOT NULL 
  AND acnc_operating_countries IS NOT NULL;

-- 12. Comprehensive filtering index (most common combinations)
CREATE INDEX IF NOT EXISTS idx_organization_cache_comprehensive_filter 
ON organization_cache (
  platform,
  category,
  address_city,
  country_code,
  acnc_operates_in_nsw,
  acnc_operates_in_vic,
  is_active
) 
WHERE platform = 'justgiving' AND is_active = true;

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
  
  RAISE NOTICE 'Filtering indexes optimization completed:';
  RAISE NOTICE '  Total indexes on organization_cache: %', index_count;
  RAISE NOTICE '  New filtering patterns optimized:';
  RAISE NOTICE '    - Category → State → Purpose → Location → Beneficiaries → Operating Countries';
  RAISE NOTICE '    - JSONB GIN indexes for purposes and beneficiaries';
  RAISE NOTICE '    - Comprehensive state filtering (all 8 Australian states)';
  RAISE NOTICE '    - Location-based filtering with country support';
END $$;