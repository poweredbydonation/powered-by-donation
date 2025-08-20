-- Migration: Add composite index for optimal sort performance
-- This index optimizes the common query pattern used in organization browsing
-- with the exact sort order: is_featured DESC, total_donations_count DESC, name ASC

-- Drop existing less optimal indexes if they exist
DROP INDEX IF EXISTS idx_organization_cache_platform_featured_active;

-- Create optimized composite index for pagination queries
-- This matches the exact ORDER BY clause: is_featured DESC, total_donations_count DESC, name ASC
CREATE INDEX IF NOT EXISTS idx_organization_cache_sort_optimized 
ON organization_cache (
  platform, 
  is_active, 
  show_on_platform,
  is_featured DESC, 
  total_donations_count DESC, 
  name ASC,
  id -- Always include primary key for stable pagination
);

-- Add specialized index for filtering + sorting
CREATE INDEX IF NOT EXISTS idx_organization_cache_category_sort 
ON organization_cache (
  platform, 
  is_active, 
  show_on_platform,
  category,
  is_featured DESC, 
  total_donations_count DESC, 
  name ASC,
  id
);

-- Add index for city filtering + sorting  
CREATE INDEX IF NOT EXISTS idx_organization_cache_city_sort 
ON organization_cache (
  platform, 
  is_active, 
  show_on_platform,
  address_city,
  is_featured DESC, 
  total_donations_count DESC, 
  name ASC,
  id
);