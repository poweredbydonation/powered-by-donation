-- Update filter lookup tables to respect show_on_platform flag
-- Remove entries that reference organizations not visible to users

-- Clear existing lookup tables
TRUNCATE TABLE justgiving_countries_lookup;
TRUNCATE TABLE justgiving_cities_lookup;
TRUNCATE TABLE acnc_categories_lookup;
TRUNCATE TABLE acnc_purposes_lookup;
TRUNCATE TABLE acnc_beneficiaries_lookup;
TRUNCATE TABLE acnc_cities_lookup;
TRUNCATE TABLE acnc_states_lookup;
TRUNCATE TABLE acnc_operating_countries_lookup;
TRUNCATE TABLE everyorg_categories_lookup;

-- Repopulate JustGiving lookup tables with show_on_platform filter
INSERT INTO justgiving_countries_lookup (country)
SELECT DISTINCT address_country
FROM organization_cache
WHERE platform = 'justgiving' 
  AND is_active = true 
  AND show_on_platform = true
  AND address_country IS NOT NULL
  AND address_country != ''
ORDER BY address_country;

INSERT INTO justgiving_cities_lookup (city)
SELECT DISTINCT address_city
FROM organization_cache
WHERE platform = 'justgiving' 
  AND is_active = true 
  AND show_on_platform = true
  AND address_city IS NOT NULL
  AND address_city != ''
ORDER BY address_city;

-- Repopulate ACNC lookup tables with show_on_platform filter
INSERT INTO acnc_categories_lookup (category)
SELECT DISTINCT category
FROM organization_cache
WHERE platform = 'acnc' 
  AND is_active = true 
  AND show_on_platform = true
  AND category IS NOT NULL
  AND category != ''
ORDER BY category;

INSERT INTO acnc_cities_lookup (city)
SELECT DISTINCT address_city
FROM organization_cache
WHERE platform = 'acnc' 
  AND is_active = true 
  AND show_on_platform = true
  AND address_city IS NOT NULL
  AND address_city != ''
ORDER BY address_city;

INSERT INTO acnc_states_lookup (state)
SELECT DISTINCT state
FROM (
  SELECT unnest(ARRAY[
    CASE WHEN acnc_operates_in_act = 'Y' THEN 'ACT' END,
    CASE WHEN acnc_operates_in_nsw = 'Y' THEN 'NSW' END,
    CASE WHEN acnc_operates_in_nt = 'Y' THEN 'NT' END,
    CASE WHEN acnc_operates_in_qld = 'Y' THEN 'QLD' END,
    CASE WHEN acnc_operates_in_sa = 'Y' THEN 'SA' END,
    CASE WHEN acnc_operates_in_tas = 'Y' THEN 'TAS' END,
    CASE WHEN acnc_operates_in_vic = 'Y' THEN 'VIC' END,
    CASE WHEN acnc_operates_in_wa = 'Y' THEN 'WA' END
  ]) as state
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
) states
WHERE state IS NOT NULL
ORDER BY state;

INSERT INTO acnc_operating_countries_lookup (country)
SELECT DISTINCT acnc_operating_countries
FROM organization_cache
WHERE platform = 'acnc' 
  AND is_active = true 
  AND show_on_platform = true
  AND acnc_operating_countries IS NOT NULL
  AND acnc_operating_countries != ''
ORDER BY acnc_operating_countries;

-- Repopulate ACNC purposes lookup with show_on_platform filter
INSERT INTO acnc_purposes_lookup (purpose)
SELECT DISTINCT jsonb_object_keys(acnc_purposes) as purpose
FROM organization_cache
WHERE platform = 'acnc' 
  AND is_active = true 
  AND show_on_platform = true
  AND acnc_purposes IS NOT NULL
  AND jsonb_typeof(acnc_purposes) = 'object'
ORDER BY purpose;

-- Repopulate ACNC beneficiaries lookup with show_on_platform filter
INSERT INTO acnc_beneficiaries_lookup (beneficiary)
SELECT DISTINCT jsonb_object_keys(acnc_beneficiaries) as beneficiary
FROM organization_cache
WHERE platform = 'acnc' 
  AND is_active = true 
  AND show_on_platform = true
  AND acnc_beneficiaries IS NOT NULL
  AND jsonb_typeof(acnc_beneficiaries) = 'object'
ORDER BY beneficiary;

-- Repopulate Every.org lookup tables with show_on_platform filter
INSERT INTO everyorg_categories_lookup (category)
SELECT DISTINCT category
FROM organization_cache
WHERE platform = 'everyorg' 
  AND is_active = true 
  AND show_on_platform = true
  AND category IS NOT NULL
  AND category != ''
ORDER BY category;

-- Log the results
DO $$
BEGIN
  RAISE NOTICE 'Lookup tables updated to respect show_on_platform flag';
  RAISE NOTICE 'JustGiving countries: %', (SELECT COUNT(*) FROM justgiving_countries_lookup);
  RAISE NOTICE 'JustGiving cities: %', (SELECT COUNT(*) FROM justgiving_cities_lookup);
  RAISE NOTICE 'ACNC categories: %', (SELECT COUNT(*) FROM acnc_categories_lookup);
  RAISE NOTICE 'ACNC purposes: %', (SELECT COUNT(*) FROM acnc_purposes_lookup);
  RAISE NOTICE 'ACNC beneficiaries: %', (SELECT COUNT(*) FROM acnc_beneficiaries_lookup);
  RAISE NOTICE 'ACNC cities: %', (SELECT COUNT(*) FROM acnc_cities_lookup);
  RAISE NOTICE 'ACNC states: %', (SELECT COUNT(*) FROM acnc_states_lookup);
  RAISE NOTICE 'ACNC operating countries: %', (SELECT COUNT(*) FROM acnc_operating_countries_lookup);
  RAISE NOTICE 'Every.org categories: %', (SELECT COUNT(*) FROM everyorg_categories_lookup);
END $$;