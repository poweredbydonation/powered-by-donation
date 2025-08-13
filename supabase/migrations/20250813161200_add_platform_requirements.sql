-- Migration: Add platform_requirements to services table
-- Date: 2025-08-13
-- Description: Adds multi-platform organization requirements system to replace legacy charity_requirement_type

-- Add platform_requirements column to services table
ALTER TABLE services 
ADD COLUMN platform_requirements JSONB DEFAULT NULL;

-- Add index for performance on platform_requirements queries  
CREATE INDEX idx_services_platform_requirements 
ON services USING GIN (platform_requirements);

-- Update existing services to have default platform requirements
UPDATE services 
SET platform_requirements = JSONB_BUILD_OBJECT(
  'type', 'any_platform',
  'allowed_platforms', ARRAY['justgiving'],
  'platform_rules', JSONB_BUILD_OBJECT(
    'justgiving', JSONB_BUILD_OBJECT(
      'entity_types', 'any_entities',
      'allowed_entities', ARRAY['charity'],
      'organizations', 
        CASE 
          WHEN charity_requirement_type = 'any_charity' THEN 'any_organizations'
          ELSE 'specific_organizations'
        END,
      'specific_organizations', 
        CASE 
          WHEN charity_requirement_type = 'specific_charities' AND preferred_charities IS NOT NULL 
          THEN (
            SELECT ARRAY_AGG(org.id::text)
            FROM organization_cache org
            WHERE org.platform = 'justgiving' 
            AND org.external_id IN (
              SELECT (jsonb_array_elements(preferred_charities)->>'charity_id')
            )
          )
          ELSE ARRAY[]::text[]
        END
    )
  )
)
WHERE platform_requirements IS NULL;

-- Add check constraint to ensure valid platform_requirements structure
ALTER TABLE services 
ADD CONSTRAINT services_platform_requirements_check 
CHECK (
  platform_requirements IS NULL OR (
    platform_requirements ? 'type' AND
    platform_requirements ? 'allowed_platforms' AND
    platform_requirements ? 'platform_rules'
  )
);

-- Comment for future reference
COMMENT ON COLUMN services.platform_requirements IS 'JSONB field storing multi-platform organization requirements - replaces legacy charity_requirement_type system';

/*
Rollback Instructions:
To rollback this migration, run:

DROP INDEX IF EXISTS idx_services_platform_requirements;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_platform_requirements_check;
ALTER TABLE services DROP COLUMN IF EXISTS platform_requirements;

Note: This will remove all multi-platform requirement data. 
Legacy charity_requirement_type and preferred_charities columns remain intact.
*/