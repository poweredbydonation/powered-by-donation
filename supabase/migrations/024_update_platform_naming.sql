-- Update platform naming from 'every_org' to 'everyorg' for consistency
-- Following uniform platform naming convention

-- First, update existing enum values
ALTER TYPE donation_platform RENAME VALUE 'every_org' TO 'everyorg';

-- Note: After ALTER TYPE RENAME VALUE, the data is automatically updated
-- No explicit UPDATE statements needed as the enum value change is applied automatically

-- Log the changes
DO $$
DECLARE
  org_count integer;
  service_count integer;
  request_count integer;
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organization_cache WHERE platform = 'everyorg';
  SELECT COUNT(*) INTO service_count FROM services WHERE platform = 'everyorg';
  SELECT COUNT(*) INTO request_count FROM service_requests WHERE platform = 'everyorg';
  SELECT COUNT(*) INTO user_count FROM users WHERE preferred_platform = 'everyorg';
  
  RAISE NOTICE 'Platform naming update completed:';
  RAISE NOTICE '  Organizations using everyorg: %', org_count;
  RAISE NOTICE '  Services using everyorg: %', service_count;
  RAISE NOTICE '  Service requests using everyorg: %', request_count;
  RAISE NOTICE '  Users preferring everyorg: %', user_count;
END $$;