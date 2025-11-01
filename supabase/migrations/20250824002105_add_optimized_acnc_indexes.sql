-- Add optimized ACNC indexes that include show_on_platform for better performance
-- These indexes match the exact filtering conditions used in the ACNC API

-- Optimized GIN index for ACNC beneficiaries filtering
CREATE INDEX idx_organization_cache_acnc_beneficiaries_optimized
ON organization_cache 
USING GIN (acnc_beneficiaries)
WHERE platform = 'acnc'::donation_platform
  AND acnc_beneficiaries IS NOT NULL
  AND is_active = true
  AND show_on_platform = true;

-- Optimized GIN index for ACNC purposes filtering  
CREATE INDEX idx_organization_cache_acnc_purposes_optimized
ON organization_cache 
USING GIN (acnc_purposes)
WHERE platform = 'acnc'::donation_platform
  AND acnc_purposes IS NOT NULL
  AND is_active = true
  AND show_on_platform = true;

-- Optimized composite index for ACNC state operations
CREATE INDEX idx_organization_cache_acnc_states_optimized
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
  is_active,
  show_on_platform
)
WHERE platform = 'acnc'::donation_platform
  AND is_active = true
  AND show_on_platform = true;

-- Optimized index for ACNC city filtering with sorting
CREATE INDEX idx_organization_cache_acnc_city_optimized
ON organization_cache (
  platform,
  is_active,
  show_on_platform,
  address_city,
  is_featured DESC,
  total_donations_count DESC,
  name,
  id
)
WHERE platform = 'acnc'::donation_platform
  AND is_active = true
  AND show_on_platform = true
  AND address_city IS NOT NULL;

-- Optimized index for ACNC category filtering with sorting
CREATE INDEX idx_organization_cache_acnc_category_optimized  
ON organization_cache (
  platform,
  is_active,
  show_on_platform,
  category,
  is_featured DESC,
  total_donations_count DESC,
  name,
  id
)
WHERE platform = 'acnc'::donation_platform
  AND is_active = true
  AND show_on_platform = true
  AND category IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_organization_cache_acnc_beneficiaries_optimized IS 'Optimized GIN index for ACNC beneficiaries filtering with show_on_platform condition';
COMMENT ON INDEX idx_organization_cache_acnc_purposes_optimized IS 'Optimized GIN index for ACNC purposes filtering with show_on_platform condition';
COMMENT ON INDEX idx_organization_cache_acnc_states_optimized IS 'Optimized composite index for ACNC state operations filtering';
COMMENT ON INDEX idx_organization_cache_acnc_city_optimized IS 'Optimized index for ACNC city filtering with sorting and show_on_platform condition';
COMMENT ON INDEX idx_organization_cache_acnc_category_optimized IS 'Optimized index for ACNC category filtering with sorting and show_on_platform condition';