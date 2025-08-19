-- Fix function search_path security warnings by setting explicit search_path
-- This prevents potential security vulnerabilities from search path manipulation

-- 1. Fix update_organization_cache_fts function
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

-- 2. Fix populate_all_acnc_charities function
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
            acnc_charity_legal_name = EXCLUDED.acnc_charity_legal_name,
            acnc_other_organisation_names = EXCLUDED.acnc_other_organisation_names,
            acnc_address_type = EXCLUDED.acnc_address_type,
            acnc_registration_date = EXCLUDED.acnc_registration_date,
            acnc_date_organisation_established = EXCLUDED.acnc_date_organisation_established,
            acnc_charity_size = EXCLUDED.acnc_charity_size,
            acnc_number_of_responsible_persons = EXCLUDED.acnc_number_of_responsible_persons,
            acnc_financial_year_end = EXCLUDED.acnc_financial_year_end,
            acnc_operates_in_act = EXCLUDED.acnc_operates_in_act,
            acnc_operates_in_nsw = EXCLUDED.acnc_operates_in_nsw,
            acnc_operates_in_nt = EXCLUDED.acnc_operates_in_nt,
            acnc_operates_in_qld = EXCLUDED.acnc_operates_in_qld,
            acnc_operates_in_sa = EXCLUDED.acnc_operates_in_sa,
            acnc_operates_in_tas = EXCLUDED.acnc_operates_in_tas,
            acnc_operates_in_vic = EXCLUDED.acnc_operates_in_vic,
            acnc_operates_in_wa = EXCLUDED.acnc_operates_in_wa,
            acnc_operating_countries = EXCLUDED.acnc_operating_countries,
            acnc_pbi = EXCLUDED.acnc_pbi,
            acnc_hpc = EXCLUDED.acnc_hpc,
            acnc_purposes = EXCLUDED.acnc_purposes,
            acnc_beneficiaries = EXCLUDED.acnc_beneficiaries,
            last_updated = now();
        
        -- Count operations
        IF FOUND THEN
            updated_count := updated_count + 1;
        ELSE
            inserted_count := inserted_count + 1;
        END IF;
        
        -- Log progress every 100 records
        IF (inserted_count + updated_count) % 100 = 0 THEN
            RAISE NOTICE 'Processed % of % records (% inserted, % updated)', 
                (inserted_count + updated_count), total_count, inserted_count, updated_count;
        END IF;
    END LOOP;
    
    -- Update table statistics
    ANALYZE organization_cache;
    
    RAISE NOTICE 'ACNC charity population completed: % inserted, % updated, % total processed', 
        inserted_count, updated_count, (inserted_count + updated_count);
END;
$$;

-- 3. Fix update_charity_processing_status function
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
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Charity with ID % not found', charity_id_param;
    END IF;
END;
$$;

-- 4. Fix get_charity_processing_progress function
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

-- 5. Fix get_next_charity_batch function
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

-- 6. Fix trigger_acnc_population function
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

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Function search_path security fix completed:';
    RAISE NOTICE '  - update_organization_cache_fts: SET search_path = public';
    RAISE NOTICE '  - populate_all_acnc_charities: SET search_path = public';
    RAISE NOTICE '  - update_charity_processing_status: SET search_path = public';
    RAISE NOTICE '  - get_charity_processing_progress: SET search_path = public';
    RAISE NOTICE '  - get_next_charity_batch: SET search_path = public';
    RAISE NOTICE '  - trigger_acnc_population: SET search_path = public';
    RAISE NOTICE 'All functions now have explicit search_path for security.';
END $$;