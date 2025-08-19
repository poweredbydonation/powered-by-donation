-- Drop and recreate functions with proper search_path to fix security warnings
-- This fixes the "cannot change return type" error by dropping first

-- 1. Drop dependent objects first
DROP TRIGGER IF EXISTS trigger_update_organization_cache_fts ON organization_cache;
DROP VIEW IF EXISTS charity_processing_status;

-- 2. Drop existing functions
DROP FUNCTION IF EXISTS populate_all_acnc_charities();
DROP FUNCTION IF EXISTS update_organization_cache_fts();
DROP FUNCTION IF EXISTS update_charity_processing_status(text, text, jsonb);
DROP FUNCTION IF EXISTS get_charity_processing_progress();
DROP FUNCTION IF EXISTS get_next_charity_batch(integer);
DROP FUNCTION IF EXISTS trigger_acnc_population();

-- 3. Recreate update_organization_cache_fts function with search_path
CREATE OR REPLACE FUNCTION update_organization_cache_fts()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.display_name, '') || ' ' ||
    COALESCE(NEW.keywords, '') || ' ' ||
    COALESCE(NEW.address_city, '') || ' ' ||
    COALESCE(NEW.address_county, '') || ' ' ||
    COALESCE(NEW.address_country, '') || ' ' ||
    COALESCE(NEW.registration_number, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$;

-- 4. Recreate populate_all_acnc_charities function with search_path
CREATE OR REPLACE FUNCTION populate_all_acnc_charities()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    charity_record RECORD;
    total_count INTEGER := 0;
    inserted_count INTEGER := 0;
    updated_count INTEGER := 0;
BEGIN
    -- Get total count for logging
    SELECT COUNT(*) INTO total_count FROM acnc_charity_data;
    
    RAISE NOTICE 'Starting ACNC charity population. Total records to process: %', total_count;
    
    -- Process all ACNC charity records
    FOR charity_record IN 
        SELECT * FROM acnc_charity_data
        WHERE abn IS NOT NULL 
        AND charity_legal_name IS NOT NULL
        ORDER BY abn
    LOOP
        -- Insert or update organization_cache record
        INSERT INTO organization_cache (
            platform,
            external_id,
            name,
            description,
            category,
            slug,
            is_active,
            is_featured,
            country_code,
            currency_code,
            
            -- ACNC specific fields
            acnc_abn,
            acnc_charity_legal_name,
            acnc_other_organisation_names,
            acnc_address_type,
            acnc_registration_date,
            acnc_date_organisation_established,
            acnc_charity_size,
            acnc_number_of_responsible_persons,
            acnc_financial_year_end,
            acnc_operates_in_act,
            acnc_operates_in_nsw,
            acnc_operates_in_nt,
            acnc_operates_in_qld,
            acnc_operates_in_sa,
            acnc_operates_in_tas,
            acnc_operates_in_vic,
            acnc_operates_in_wa,
            acnc_operating_countries,
            acnc_pbi,
            acnc_hpc,
            acnc_purposes,
            acnc_beneficiaries
        )
        VALUES (
            'justgiving'::donation_platform,
            charity_record.abn,
            charity_record.charity_legal_name,
            charity_record.other_organisation_names,
            CASE 
                WHEN charity_record.purposes::text LIKE '%health%' THEN 'Health'
                WHEN charity_record.purposes::text LIKE '%education%' THEN 'Education'
                WHEN charity_record.purposes::text LIKE '%environment%' THEN 'Environment'
                WHEN charity_record.purposes::text LIKE '%animal%' THEN 'Animals'
                WHEN charity_record.purposes::text LIKE '%religion%' THEN 'Religion'
                WHEN charity_record.purposes::text LIKE '%arts%' OR charity_record.purposes::text LIKE '%culture%' THEN 'Arts & Culture'
                WHEN charity_record.purposes::text LIKE '%human%' OR charity_record.purposes::text LIKE '%rights%' THEN 'Human Rights'
                WHEN charity_record.purposes::text LIKE '%social%' OR charity_record.purposes::text LIKE '%welfare%' THEN 'Social Welfare'
                ELSE 'General Charitable Purposes'
            END,
            lower(replace(replace(charity_record.charity_legal_name, ' ', '-'), '''', '')),
            true,
            false,
            'AU',
            'AUD',
            
            -- ACNC fields
            charity_record.abn,
            charity_record.charity_legal_name,
            charity_record.other_organisation_names,
            charity_record.address_type,
            charity_record.registration_date,
            charity_record.date_organisation_established,
            charity_record.charity_size,
            charity_record.number_of_responsible_persons,
            charity_record.financial_year_end,
            charity_record.operates_in_act,
            charity_record.operates_in_nsw,
            charity_record.operates_in_nt,
            charity_record.operates_in_qld,
            charity_record.operates_in_sa,
            charity_record.operates_in_tas,
            charity_record.operates_in_vic,
            charity_record.operates_in_wa,
            charity_record.operating_countries,
            charity_record.pbi,
            charity_record.hpc,
            charity_record.purposes,
            charity_record.beneficiaries
        )
        ON CONFLICT (platform, external_id) 
        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            last_updated = now();
        
        -- Count operations
        IF FOUND THEN
            updated_count := updated_count + 1;
        ELSE
            inserted_count := inserted_count + 1;
        END IF;
        
        -- Log progress every 100 records
        IF (inserted_count + updated_count) % 100 = 0 THEN
            RAISE NOTICE 'Processed % of % records', (inserted_count + updated_count), total_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'ACNC charity population completed: % inserted, % updated', inserted_count, updated_count;
END;
$$;

-- 5. Recreate update_charity_processing_status function with search_path
CREATE OR REPLACE FUNCTION update_charity_processing_status(
    charity_id_param text,
    status_param text,
    details_param jsonb DEFAULT NULL
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE organization_cache 
    SET 
        enhanced_data_fetched_at = CASE 
            WHEN status_param = 'completed' THEN now() 
            ELSE enhanced_data_fetched_at 
        END,
        api_fetch_attempts = CASE 
            WHEN status_param = 'failed' THEN COALESCE(api_fetch_attempts, 0) + 1
            WHEN status_param = 'completed' THEN 0
            ELSE api_fetch_attempts
        END,
        last_updated = now()
    WHERE platform = 'justgiving' AND external_id = charity_id_param;
END;
$$;

-- 6. Recreate get_charity_processing_progress function with search_path
CREATE OR REPLACE FUNCTION get_charity_processing_progress()
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    total_count integer;
    enhanced_count integer;
    pending_count integer;
    failed_count integer;
BEGIN
    SELECT COUNT(*) INTO total_count 
    FROM organization_cache 
    WHERE platform = 'justgiving';
    
    SELECT COUNT(*) INTO enhanced_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' AND enhanced_data_fetched_at IS NOT NULL;
    
    SELECT COUNT(*) INTO pending_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' 
      AND enhanced_data_fetched_at IS NULL 
      AND COALESCE(api_fetch_attempts, 0) < 3;
    
    SELECT COUNT(*) INTO failed_count 
    FROM organization_cache 
    WHERE platform = 'justgiving' 
      AND enhanced_data_fetched_at IS NULL 
      AND COALESCE(api_fetch_attempts, 0) >= 3;
    
    result := jsonb_build_object(
        'total_charities', total_count,
        'enhanced_charities', enhanced_count,
        'pending_charities', pending_count,
        'failed_charities', failed_count,
        'completion_percentage', CASE 
            WHEN total_count > 0 THEN ROUND((enhanced_count::numeric / total_count::numeric) * 100, 2)
            ELSE 0 
        END,
        'last_updated', now()
    );
    
    RETURN result;
END;
$$;

-- 7. Recreate get_next_charity_batch function with search_path
CREATE OR REPLACE FUNCTION get_next_charity_batch(batch_size integer DEFAULT 20)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    charity_batch jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', external_id,
            'name', name,
            'slug', slug
        )
    ) INTO charity_batch
    FROM (
        SELECT external_id, name, slug
        FROM organization_cache 
        WHERE platform = 'justgiving'
          AND enhanced_data_fetched_at IS NULL
          AND COALESCE(api_fetch_attempts, 0) < 3
        ORDER BY last_updated ASC
        LIMIT batch_size
    ) batch;
    
    RETURN COALESCE(charity_batch, '[]'::jsonb);
END;
$$;

-- 8. Recreate trigger_acnc_population function with search_path
CREATE OR REPLACE FUNCTION trigger_acnc_population()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM populate_all_acnc_charities();
    RAISE NOTICE 'ACNC population triggered successfully';
END;
$$;

-- 9. Recreate the trigger for FTS updates
CREATE TRIGGER trigger_update_organization_cache_fts
  BEFORE INSERT OR UPDATE ON organization_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_cache_fts();

-- 10. Recreate the charity_processing_status view
CREATE OR REPLACE VIEW charity_processing_status AS
SELECT * FROM get_charity_processing_progress();

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Functions recreated with search_path security:';
    RAISE NOTICE '  ✅ update_organization_cache_fts';
    RAISE NOTICE '  ✅ populate_all_acnc_charities';  
    RAISE NOTICE '  ✅ update_charity_processing_status';
    RAISE NOTICE '  ✅ get_charity_processing_progress';
    RAISE NOTICE '  ✅ get_next_charity_batch';
    RAISE NOTICE '  ✅ trigger_acnc_population';
    RAISE NOTICE '  ✅ charity_processing_status view';
    RAISE NOTICE 'All functions now have SET search_path = public for security.';
END $$;