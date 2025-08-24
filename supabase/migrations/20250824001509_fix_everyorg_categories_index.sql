-- Drop the existing GIN index that doesn't include show_on_platform
DROP INDEX IF EXISTS idx_organization_cache_everyorg_categories_gin;

-- Create a new GIN index that matches our actual query conditions
CREATE INDEX idx_organization_cache_everyorg_categories_gin
ON organization_cache 
USING GIN (categories_list)
WHERE platform = 'everyorg'::donation_platform
  AND categories_list IS NOT NULL
  AND is_active = true
  AND show_on_platform = true;

-- Add comment for documentation
COMMENT ON INDEX idx_organization_cache_everyorg_categories_gin IS 'GIN index for Every.org categories_list filtering with all query conditions for optimal performance';