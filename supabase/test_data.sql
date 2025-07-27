-- Test Data Insertion
-- Simple test to verify database schema works correctly

-- Insert test charity
INSERT INTO charity_cache (
  justgiving_charity_id,
  name,
  description,
  category,
  slug,
  is_active
) VALUES (
  'test-charity-123',
  'Test Cancer Research',
  'A test charity for cancer research',
  'Health',
  'test-cancer-research',
  true
);

-- Insert test provider
INSERT INTO providers (
  id,
  name,
  bio,
  show_bio,
  show_in_directory
) VALUES (
  gen_random_uuid(),
  'John Developer',
  'Full-stack developer specializing in web applications',
  true,
  true
);

-- Insert test supporter  
INSERT INTO supporters (
  id,
  name,
  show_in_directory
) VALUES (
  gen_random_uuid(),
  'Jane Supporter',
  false
);

-- Test that all tables were created successfully
SELECT 'charity_cache' as table_name, COUNT(*) as record_count FROM charity_cache
UNION ALL
SELECT 'providers', COUNT(*) FROM providers
UNION ALL  
SELECT 'supporters', COUNT(*) FROM supporters
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'service_requests', COUNT(*) FROM service_requests;