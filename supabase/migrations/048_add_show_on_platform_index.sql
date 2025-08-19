-- Add index for show_on_platform column for better query performance
-- This index will speed up queries that filter by show_on_platform

-- Index for show_on_platform column
CREATE INDEX IF NOT EXISTS idx_organization_cache_show_on_platform 
ON public.organization_cache USING btree (show_on_platform) 
TABLESPACE pg_default;

-- Composite index for platform + show_on_platform (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_organization_cache_platform_show_on_platform 
ON public.organization_cache USING btree (platform, show_on_platform, is_active) 
TABLESPACE pg_default;

-- Comment explaining the purpose
COMMENT ON COLUMN public.organization_cache.show_on_platform 
IS 'Boolean flag to control whether organization appears in public listings. Updated daily by cron job based on data quality rules (e.g., JustGiving orgs without descriptions are hidden).';