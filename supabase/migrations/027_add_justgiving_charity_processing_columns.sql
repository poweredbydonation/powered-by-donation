-- Migration: Add processing columns to JustGivingCharityNames table
-- Date: 2025-01-15
-- Description: Adds tracking columns for JustGiving API processing workflow

-- Add processing tracking columns
ALTER TABLE public."JustGivingCharityNames" 
ADD COLUMN "query_datetime" timestamptz DEFAULT NULL,
ADD COLUMN "charity_id" integer DEFAULT NULL,
ADD COLUMN "add_to_cache_date" timestamptz DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX idx_justgiving_charity_names_charity_id 
ON public."JustGivingCharityNames" (charity_id);

CREATE INDEX idx_justgiving_charity_names_query_datetime 
ON public."JustGivingCharityNames" (query_datetime);

CREATE INDEX idx_justgiving_charity_names_cache_status 
ON public."JustGivingCharityNames" (charity_id, add_to_cache_date);

-- Add comments for documentation
COMMENT ON COLUMN public."JustGivingCharityNames"."query_datetime" IS 'Timestamp when OneSearch API was called to find charity ID for this name';
COMMENT ON COLUMN public."JustGivingCharityNames"."charity_id" IS 'JustGiving charity ID obtained from OneSearch API (null if not found)';
COMMENT ON COLUMN public."JustGivingCharityNames"."add_to_cache_date" IS 'Timestamp when charity details were successfully added to organization_cache table';

/*
Processing Workflow:
1. query_datetime: Set when searching for charity via OneSearch API
2. charity_id: Set if charity found in search results
3. add_to_cache_date: Set when charity details cached via GetCharityById API

Rollback Instructions:
To rollback this migration, run:

DROP INDEX IF EXISTS idx_justgiving_charity_names_charity_id;
DROP INDEX IF EXISTS idx_justgiving_charity_names_query_datetime;
DROP INDEX IF EXISTS idx_justgiving_charity_names_cache_status;
ALTER TABLE public."JustGivingCharityNames" 
DROP COLUMN IF EXISTS "query_datetime",
DROP COLUMN IF EXISTS "charity_id", 
DROP COLUMN IF EXISTS "add_to_cache_date";
*/