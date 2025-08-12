-- Make nonprofit_ein nullable in every_org_nonprofit_cache table
-- Many international nonprofits don't have EIN numbers

-- Remove the existing primary key constraint
ALTER TABLE public.every_org_nonprofit_cache DROP CONSTRAINT every_org_nonprofit_cache_pkey;

-- Make nonprofit_ein nullable
ALTER TABLE public.every_org_nonprofit_cache ALTER COLUMN nonprofit_ein DROP NOT NULL;

-- Use slug as primary key instead (which is guaranteed to be unique)
ALTER TABLE public.every_org_nonprofit_cache ADD CONSTRAINT every_org_nonprofit_cache_pkey PRIMARY KEY (slug);

-- Create index on nonprofit_ein for US-based nonprofits that do have EINs
CREATE INDEX IF NOT EXISTS idx_every_org_nonprofit_cache_ein 
ON public.every_org_nonprofit_cache USING btree (nonprofit_ein) 
WHERE nonprofit_ein IS NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.every_org_nonprofit_cache.nonprofit_ein IS 'EIN number for US-based nonprofits. NULL for international organizations.';