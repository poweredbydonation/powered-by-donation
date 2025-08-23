

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."charity_requirement_enum" AS ENUM (
    'any_charity',
    'specific_charities'
);


ALTER TYPE "public"."charity_requirement_enum" OWNER TO "postgres";


CREATE TYPE "public"."currency_code" AS ENUM (
    'GBP',
    'USD',
    'CAD',
    'AUD',
    'EUR'
);


ALTER TYPE "public"."currency_code" OWNER TO "postgres";


CREATE TYPE "public"."donation_platform" AS ENUM (
    'justgiving',
    'everyorg',
    'acnc'
);


ALTER TYPE "public"."donation_platform" OWNER TO "postgres";


COMMENT ON TYPE "public"."donation_platform" IS 'Supported donation platforms: JustGiving and Every.org';



CREATE TYPE "public"."service_status" AS ENUM (
    'pending',
    'success',
    'provider_review',
    'acknowledged_feedback',
    'disputed_feedback',
    'unresponsive_to_feedback'
);


ALTER TYPE "public"."service_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
  DECLARE
    total_fundraiser_ratings INTEGER;
    happy_fundraiser_ratings INTEGER;
    total_donor_ratings INTEGER;
    happy_donor_ratings INTEGER;
  BEGIN
    -- Calculate received happiness (how fundraisers rate this donor)
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE fundraiser_rates_donor = 'happy')
    INTO total_fundraiser_ratings, happy_fundraiser_ratings
    FROM service_requests
    WHERE donor_id = donor_uuid
      AND fundraiser_rates_donor IS NOT NULL;

    -- Calculate sent happiness (how this donor rates fundraisers/services)
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE donor_rates_fundraiser = 'happy' OR donor_rates_service = 'happy')
    INTO total_donor_ratings, happy_donor_ratings
    FROM service_requests
    WHERE donor_id = donor_uuid
      AND (donor_rates_fundraiser IS NOT NULL OR donor_rates_service IS NOT NULL);

    -- Update user happiness metrics (donor)
    UPDATE users
    SET
      received_happiness = CASE
        WHEN total_fundraiser_ratings > 0 THEN
          ROUND((happy_fundraiser_ratings::decimal / total_fundraiser_ratings) * 100)
        ELSE NULL
      END,
      sent_happiness = CASE
        WHEN total_donor_ratings > 0 THEN
          ROUND((happy_donor_ratings::decimal / total_donor_ratings) * 100)
        ELSE NULL
      END
    WHERE id = donor_uuid;
  END;
  $$;


ALTER FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") IS 'Calculate happiness metrics for donor - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
  DECLARE
    total_donor_ratings INTEGER;
    happy_donor_ratings INTEGER;
    total_fundraiser_ratings INTEGER;
    happy_fundraiser_ratings INTEGER;
  BEGIN
    -- Calculate received happiness (how donors rate this fundraiser)
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE donor_rates_fundraiser = 'happy')
    INTO total_donor_ratings, happy_donor_ratings
    FROM service_requests
    WHERE fundraiser_id = fundraiser_uuid
      AND donor_rates_fundraiser IS NOT NULL;

    -- Calculate sent happiness (how this fundraiser rates donors)
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE fundraiser_rates_donor = 'happy')
    INTO total_fundraiser_ratings, happy_fundraiser_ratings
    FROM service_requests
    WHERE fundraiser_id = fundraiser_uuid
      AND fundraiser_rates_donor IS NOT NULL;

    -- Update user happiness metrics (fundraiser)
    UPDATE users
    SET
      received_happiness = CASE
        WHEN total_donor_ratings > 0 THEN
          ROUND((happy_donor_ratings::decimal / total_donor_ratings) * 100)
        ELSE NULL
      END,
      sent_happiness = CASE
        WHEN total_fundraiser_ratings > 0 THEN
          ROUND((happy_fundraiser_ratings::decimal / total_fundraiser_ratings) * 100)
        ELSE NULL
      END
    WHERE id = fundraiser_uuid;
  END;
  $$;


ALTER FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") IS 'Calculate happiness metrics for fundraiser - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
  DECLARE
    total_ratings INTEGER;
    happy_ratings INTEGER;
  BEGIN
    -- Calculate service happiness rate
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE donor_rates_service = 'happy')
    INTO total_ratings, happy_ratings
    FROM service_requests
    WHERE service_id = service_uuid
      AND donor_rates_service IS NOT NULL;

    -- Update service happiness rate
    UPDATE services
    SET happiness_rate = CASE
      WHEN total_ratings > 0 THEN
        ROUND((happy_ratings::decimal / total_ratings) * 100)
      ELSE NULL
    END
    WHERE id = service_uuid;
  END;
  $$;


ALTER FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") IS 'Calculate happiness metrics for service - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    reference_num INTEGER;
    reference_id TEXT;
BEGIN
    CASE platform_type
        WHEN 'justgiving' THEN
            reference_num := nextval('donation_reference_jg_seq');
            reference_id := 'PD-JG-' || reference_num;
        WHEN 'every_org' THEN
            reference_num := nextval('donation_reference_ev_seq');
            reference_id := 'PD-EV-' || reference_num;
        ELSE
            RAISE EXCEPTION 'Unknown platform type: %', platform_type;
    END CASE;
    
    RETURN reference_id;
END;
$$;


ALTER FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") IS 'Generates sequential platform-specific references';



CREATE OR REPLACE FUNCTION "public"."get_charity_processing_progress"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result jsonb;
    total_count integer;
    enhanced_count integer;
    pending_count integer;
    failed_count integer;
BEGIN
    -- Security check: only allow service role access
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied. This function requires service role privileges.';
    END IF;
    
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


ALTER FUNCTION "public"."get_charity_processing_progress"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_charity_processing_progress"() IS 'Administrative function for charity processing progress. Restricted to service role only for security.';



CREATE OR REPLACE FUNCTION "public"."get_next_charity_batch"("batch_size" integer DEFAULT 20) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_next_charity_batch"("batch_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform" DEFAULT 'justgiving'::"public"."donation_platform") RETURNS TABLE("name" "text", "description" "text", "logo_url" "text", "total_donations_count" integer, "total_amount_received" numeric, "this_month_count" integer, "this_month_amount" numeric, "service_categories" "jsonb", "platform" "public"."donation_platform")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.name FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.name FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.description FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.description FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.logo_url FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.logo_url FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.total_donations_count FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.total_donations_count FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.total_amount_received FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.total_amount_received FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.this_month_count FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.this_month_count FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.this_month_amount FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.this_month_amount FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        CASE 
            WHEN platform_type = 'justgiving' THEN
                (SELECT jc.service_categories FROM justgiving_charity_cache jc WHERE jc.slug = organization_slug AND jc.is_active = true)
            WHEN platform_type = 'every_org' THEN
                (SELECT ec.service_categories FROM every_org_nonprofit_cache ec WHERE ec.slug = organization_slug AND ec.is_active = true)
        END,
        platform_type;
$$;


ALTER FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform") IS 'Get public organization stats by slug and platform';



CREATE OR REPLACE FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update charity statistics
  INSERT INTO charity_cache (
    justgiving_charity_id, 
    name, 
    slug,
    total_donations_count, 
    total_amount_received,
    this_month_count,
    this_month_amount,
    service_categories,
    stats_last_updated
  ) VALUES (
    charity_id,
    'Unknown Charity', -- Will be updated by JustGiving sync
    LOWER(REPLACE(charity_id, ' ', '-')), -- Temporary slug
    1,
    amount,
    1,
    amount,
    CASE 
      WHEN service_category IS NOT NULL THEN json_build_object(service_category, 1)::jsonb
      ELSE '{}'::jsonb
    END,
    NOW()
  )
  ON CONFLICT (justgiving_charity_id) 
  DO UPDATE SET
    total_donations_count = charity_cache.total_donations_count + 1,
    total_amount_received = charity_cache.total_amount_received + amount,
    this_month_count = charity_cache.this_month_count + 1,
    this_month_amount = charity_cache.this_month_amount + amount,
    service_categories = CASE
      WHEN service_category IS NOT NULL THEN
        charity_cache.service_categories || 
        json_build_object(
          service_category, 
          COALESCE((charity_cache.service_categories->>service_category)::integer, 0) + 1
        )::jsonb
      ELSE charity_cache.service_categories
    END,
    stats_last_updated = NOW();
END;
$$;


ALTER FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text") IS 'Increment charity donation statistics - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."is_meaningful_description"("description_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$
  BEGIN
    -- Return false if description is null or empty
    IF description_text IS NULL OR TRIM(description_text) = '' THEN
      RETURN FALSE;
    END IF;

    -- Return false if description is only whitespace characters
    IF TRIM(description_text) ~ '^\s*$' THEN
      RETURN FALSE;
    END IF;

    -- Return false if description is just placeholder text
    IF TRIM(LOWER(description_text)) IN (
      '.', '..', '...', '....', '.....',
      'n/a', 'na', 'none', 'nil', 'null',
      'tbc', 'tbd', 'coming soon', 'to be confirmed',
      'to be determined', 'created via charity sign up service.',
      'no description field provided by new form.',
      'pending', 'update pending'
    ) THEN
      RETURN FALSE;
    END IF;

    -- Return false if description is only dots (any number of dots)
    IF TRIM(description_text) ~ '^\.+$' THEN
      RETURN FALSE;
    END IF;

    -- Return false if description is too short (less than 10 characters after trimming)
    IF LENGTH(TRIM(description_text)) < 10 THEN
      RETURN FALSE;
    END IF;

    -- Return false if description is only repeated single characters
    IF TRIM(description_text) ~ '^(.)\1+$' AND LENGTH(TRIM(description_text)) <= 10 THEN
      RETURN FALSE;
    END IF;

    -- If all checks pass, description is meaningful
    RETURN TRUE;
  END;
  $_$;


ALTER FUNCTION "public"."is_meaningful_description"("description_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_all_acnc_charities"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."populate_all_acnc_charities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_lookup_tables_direct"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  org_record RECORD;
BEGIN
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

  RAISE NOTICE 'Cleared all lookup tables';

  -- Populate JustGiving lookups
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

  -- Populate ACNC lookups
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

  INSERT INTO acnc_purposes_lookup (purpose)
  SELECT DISTINCT jsonb_object_keys(acnc_purposes) as purpose
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND acnc_purposes IS NOT NULL
    AND jsonb_typeof(acnc_purposes) = 'object'
  ORDER BY purpose;

  INSERT INTO acnc_beneficiaries_lookup (beneficiary)
  SELECT DISTINCT jsonb_object_keys(acnc_beneficiaries) as beneficiary
  FROM organization_cache
  WHERE platform = 'acnc' 
    AND is_active = true 
    AND show_on_platform = true
    AND acnc_beneficiaries IS NOT NULL
    AND jsonb_typeof(acnc_beneficiaries) = 'object'
  ORDER BY beneficiary;

  -- Populate Every.org lookups
  INSERT INTO everyorg_categories_lookup (category)
  SELECT DISTINCT category
  FROM organization_cache
  WHERE platform = 'everyorg' 
    AND is_active = true 
    AND show_on_platform = true
    AND category IS NOT NULL
    AND category != ''
  ORDER BY category;

  RAISE NOTICE 'Successfully populated all lookup tables';
END;
$$;


ALTER FUNCTION "public"."populate_lookup_tables_direct"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."populate_lookup_tables_direct"() IS 'Directly populates all filter lookup tables from organization_cache, respecting show_on_platform flag. Used by cron job to avoid HTTP auth issues.';



CREATE OR REPLACE FUNCTION "public"."reset_monthly_charity_stats"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE charity_cache 
  SET 
    this_month_count = 0,
    this_month_amount = 0,
    stats_last_updated = NOW();
END;
$$;


ALTER FUNCTION "public"."reset_monthly_charity_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reset_monthly_charity_stats"() IS 'Reset monthly charity statistics - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."trigger_acnc_population"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    PERFORM populate_all_acnc_charities();
    RAISE NOTICE 'ACNC population triggered successfully at %', now();
END;
$$;


ALTER FUNCTION "public"."trigger_acnc_population"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_happiness_metrics"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
  BEGIN
    -- Only update if rating fields changed
    IF (OLD.donor_rates_fundraiser IS DISTINCT FROM NEW.donor_rates_fundraiser) OR
       (OLD.fundraiser_rates_donor IS DISTINCT FROM NEW.fundraiser_rates_donor) OR
       (OLD.donor_rates_service IS DISTINCT FROM NEW.donor_rates_service) THEN

      -- Update fundraiser happiness
      PERFORM calculate_fundraiser_happiness(NEW.fundraiser_id);

      -- Update donor happiness
      PERFORM calculate_donor_happiness(NEW.donor_id);

      -- Update service happiness
      PERFORM calculate_service_happiness(NEW.service_id);
    END IF;

    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."trigger_update_happiness_metrics"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_update_happiness_metrics"() IS 'Trigger function to update happiness metrics - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."update_charity_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.fts := to_tsvector('english', 
    coalesce(NEW.name, '') || ' ' || 
    coalesce(NEW.description, '') || ' ' || 
    coalesce(NEW.keywords, '') || ' ' || 
    coalesce(NEW.address_city, '') || ' ' ||
    coalesce(NEW.registration_number, '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_charity_fts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_charity_fts"() IS 'Update full-text search vector for charity cache - search_path set for security';



CREATE OR REPLACE FUNCTION "public"."update_charity_processing_status"("charity_id_param" "text", "status_param" "text", "details_param" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
        RAISE NOTICE 'No charity found with ID: %', charity_id_param;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_charity_processing_status"("charity_id_param" "text", "status_param" "text", "details_param" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_cache_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."update_organization_cache_fts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_platform_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_services_count INTEGER;
    v_justgiving_count INTEGER;
    v_everyorg_count INTEGER;
    v_acnc_count INTEGER;
BEGIN
    -- Count active services
    SELECT COUNT(*)
    INTO v_services_count
    FROM services
    WHERE is_active = true;

    -- Count active JustGiving organizations that should show on platform
    SELECT COUNT(*)
    INTO v_justgiving_count
    FROM organization_cache
    WHERE platform = 'justgiving'
      AND is_active = true
      AND show_on_platform = true;

    -- Count active Every.org organizations that should show on platform
    SELECT COUNT(*)
    INTO v_everyorg_count
    FROM organization_cache
    WHERE platform = 'everyorg'
      AND is_active = true
      AND show_on_platform = true;

    -- Count active ACNC organizations that should show on platform
    SELECT COUNT(*)
    INTO v_acnc_count
    FROM organization_cache
    WHERE platform = 'acnc'
      AND is_active = true
      AND show_on_platform = true;

    -- Update the stats table (should only have one row)
    UPDATE platform_stats 
    SET 
        services_count = v_services_count,
        justgiving_count = v_justgiving_count,
        everyorg_count = v_everyorg_count,
        acnc_count = v_acnc_count,
        last_updated = NOW()
    WHERE id = 1;

    -- If no row exists, insert one
    IF NOT FOUND THEN
        INSERT INTO platform_stats (id, services_count, justgiving_count, everyorg_count, acnc_count)
        VALUES (1, v_services_count, v_justgiving_count, v_everyorg_count, v_acnc_count);
    END IF;

    -- Log the update
    RAISE NOTICE 'Platform stats updated: Services=%, JustGiving=%, Every.org=%, ACNC=%', 
        v_services_count, v_justgiving_count, v_everyorg_count, v_acnc_count;
END;
$$;


ALTER FUNCTION "public"."update_platform_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer DEFAULT 1000) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
  DECLARE
    updated_count INTEGER := 0;
    total_updated INTEGER := 0;
  BEGIN
    -- Loop until no more rows need updating
    LOOP
      -- Update a batch of organizations that need show_on_platform = false
      UPDATE organization_cache
      SET show_on_platform = false
      WHERE id IN (
        SELECT id
        FROM organization_cache
        WHERE show_on_platform = true
          AND NOT is_meaningful_description(description)
        LIMIT batch_size
      );

      GET DIAGNOSTICS updated_count = ROW_COUNT;
      total_updated := total_updated + updated_count;

      -- Exit if no more rows to update
      IF updated_count = 0 THEN
        EXIT;
      END IF;

      -- Small delay to prevent overload
      PERFORM pg_sleep(0.1);
    END LOOP;

    RETURN total_updated;
  END;
  $$;


ALTER FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ACNC_Registered_Charities" (
    "ABN" "text" NOT NULL,
    "Charity_Legal_Name" "text",
    "Other_Organisation_Names" "text",
    "Address_Type" "text",
    "Address_Line_1" "text",
    "Address_Line_2" "text",
    "Address_Line_3" "text",
    "Town_City" "text",
    "State" "text",
    "Postcode" "text",
    "Country" "text",
    "Charity_Website" "text",
    "Registration_Date" "text",
    "Date_Organisation_Established" "text",
    "Charity_Size" "text",
    "Number_of_Responsible_Persons" "text",
    "Financial_Year_End" "text",
    "Operates_in_ACT" "text",
    "Operates_in_NSW" "text",
    "Operates_in_NT" "text",
    "Operates_in_QLD" "text",
    "Operates_in_SA" "text",
    "Operates_in_TAS" "text",
    "Operates_in_VIC" "text",
    "Operates_in_WA" "text",
    "Operating_Countries" "text",
    "PBI" "text",
    "HPC" "text",
    "Preventing_or_relieving_suffering_of_animals" "text",
    "Advancing_Culture" "text",
    "Advancing_Education" "text",
    "Advancing_Health" "text",
    "Promote_or_oppose_a_change_to_law__government_poll_or_prac" "text",
    "Advancing_natual_environment" "text",
    "Promoting_or_protecting_human_rights" "text",
    "Purposes_beneficial_to_ther_general_public_and_other_analogous" "text",
    "Promoting_reconciliation__mutual_respect_and_tolerance" "text",
    "Advancing_Religion" "text",
    "Advancing_social_or_public_welfare" "text",
    "Advancing_security_or_safety_of_Australia_or_Australian_public" "text",
    "Aboriginal_or_TSI" "text",
    "Adults" "text",
    "Aged_Persons" "text",
    "Children" "text",
    "Communities_Overseas" "text",
    "Early_Childhood" "text",
    "Ethnic_Groups" "text",
    "Families" "text",
    "Females" "text",
    "Financially_Disadvantaged" "text",
    "LGBTIQA+" "text",
    "General_Community_in_Australia" "text",
    "Males" "text",
    "Migrants_Refugees_or_Asylum_Seekers" "text",
    "Other_Beneficiaries" "text",
    "Other_Charities" "text",
    "People_at_risk_of_homelessness" "text",
    "People_with_Chronic_Illness" "text",
    "People_with_Disabilities" "text",
    "Pre_Post_Release_Offenders" "text",
    "Rural_Regional_Remote_Communities" "text",
    "Unemployed_Person" "text",
    "Veterans_or_their_families" "text",
    "Victims_of_crime" "text",
    "Victims_of_Disasters" "text",
    "Youth" "text",
    "animals" "text",
    "environment" "text",
    "other_gender_identities" "text"
);


ALTER TABLE "public"."ACNC_Registered_Charities" OWNER TO "postgres";


COMMENT ON TABLE "public"."ACNC_Registered_Charities" IS 'ACNC charity reference data. Public read access with service role management.';



CREATE TABLE IF NOT EXISTS "public"."JustGivingCharityNames" (
    "Charity_Name" "text" NOT NULL,
    "query_datetime" timestamp with time zone,
    "charity_id" integer,
    "add_to_cache_date" timestamp with time zone
);


ALTER TABLE "public"."JustGivingCharityNames" OWNER TO "postgres";


COMMENT ON TABLE "public"."JustGivingCharityNames" IS 'JustGiving charity reference data. Public read access with service role management.';



COMMENT ON COLUMN "public"."JustGivingCharityNames"."query_datetime" IS 'Timestamp when OneSearch API was called to find charity ID for this name';



COMMENT ON COLUMN "public"."JustGivingCharityNames"."charity_id" IS 'JustGiving charity ID obtained from OneSearch API (null if not found)';



COMMENT ON COLUMN "public"."JustGivingCharityNames"."add_to_cache_date" IS 'Timestamp when charity details were successfully added to organization_cache table';



CREATE TABLE IF NOT EXISTS "public"."acnc_beneficiaries_lookup" (
    "id" integer NOT NULL,
    "beneficiary" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_beneficiaries_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_beneficiaries_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_beneficiaries_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_beneficiaries_lookup_id_seq" OWNED BY "public"."acnc_beneficiaries_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."acnc_categories_lookup" (
    "id" integer NOT NULL,
    "category" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_categories_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_categories_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_categories_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_categories_lookup_id_seq" OWNED BY "public"."acnc_categories_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."acnc_cities_lookup" (
    "id" integer NOT NULL,
    "city" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_cities_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_cities_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_cities_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_cities_lookup_id_seq" OWNED BY "public"."acnc_cities_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."acnc_cron_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_time" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'started'::"text" NOT NULL,
    "batch_size" integer,
    "offset_value" integer,
    "processed_count" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "response_data" "jsonb",
    "error_message" "text",
    "duration_ms" integer
);


ALTER TABLE "public"."acnc_cron_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."acnc_cron_logs" IS 'Execution logs for ACNC charity cache population cron job';



CREATE TABLE IF NOT EXISTS "public"."acnc_operating_countries_lookup" (
    "id" integer NOT NULL,
    "country" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_operating_countries_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_operating_countries_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_operating_countries_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_operating_countries_lookup_id_seq" OWNED BY "public"."acnc_operating_countries_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."acnc_purposes_lookup" (
    "id" integer NOT NULL,
    "purpose" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_purposes_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_purposes_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_purposes_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_purposes_lookup_id_seq" OWNED BY "public"."acnc_purposes_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."acnc_states_lookup" (
    "id" integer NOT NULL,
    "state" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."acnc_states_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."acnc_states_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."acnc_states_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."acnc_states_lookup_id_seq" OWNED BY "public"."acnc_states_lookup"."id";



CREATE OR REPLACE VIEW "public"."charity_processing_status" WITH ("security_invoker"='on') AS
 SELECT "get_charity_processing_progress"
   FROM "public"."get_charity_processing_progress"() "get_charity_processing_progress"("get_charity_processing_progress");


ALTER VIEW "public"."charity_processing_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."charity_processing_status" IS 'Administrative view for charity processing progress. Access restricted via underlying function security.';



CREATE SEQUENCE IF NOT EXISTS "public"."donation_reference_ev_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."donation_reference_ev_seq" OWNER TO "postgres";


COMMENT ON SEQUENCE "public"."donation_reference_ev_seq" IS 'Sequential references for Every.org donations (PD-EV-1000+)';



CREATE SEQUENCE IF NOT EXISTS "public"."donation_reference_jg_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."donation_reference_jg_seq" OWNER TO "postgres";


COMMENT ON SEQUENCE "public"."donation_reference_jg_seq" IS 'Sequential references for JustGiving donations (PD-JG-1000+)';



CREATE TABLE IF NOT EXISTS "public"."every_org_nonprofit_cache" (
    "nonprofit_ein" "text",
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "logo_url" "text",
    "slug" "text" NOT NULL,
    "total_donations_count" integer DEFAULT 0,
    "total_amount_received" numeric DEFAULT 0,
    "this_month_count" integer DEFAULT 0,
    "this_month_amount" numeric DEFAULT 0,
    "service_categories" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "page_views" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "stats_last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."every_org_nonprofit_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."every_org_nonprofit_cache" IS 'Cached Every.org nonprofit data';



COMMENT ON COLUMN "public"."every_org_nonprofit_cache"."nonprofit_ein" IS 'EIN number for US-based nonprofits. NULL for international organizations.';



CREATE TABLE IF NOT EXISTS "public"."everyorg_categories_lookup" (
    "id" integer NOT NULL,
    "category" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."everyorg_categories_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."everyorg_categories_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."everyorg_categories_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."everyorg_categories_lookup_id_seq" OWNED BY "public"."everyorg_categories_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_currency" "text" NOT NULL,
    "to_currency" "text" NOT NULL,
    "rate" numeric(12,6) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "exchange_rates_from_currency_check" CHECK (("from_currency" = ANY (ARRAY['GBP'::"text", 'USD'::"text", 'EUR'::"text", 'CAD'::"text", 'AUD'::"text"]))),
    CONSTRAINT "exchange_rates_to_currency_check" CHECK (("to_currency" = ANY (ARRAY['GBP'::"text", 'USD'::"text", 'EUR'::"text", 'CAD'::"text", 'AUD'::"text"])))
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


COMMENT ON TABLE "public"."exchange_rates" IS 'Exchange rates table with RLS enabled for security compliance';



CREATE TABLE IF NOT EXISTS "public"."justgiving_charity_cache" (
    "justgiving_charity_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "logo_url" "text",
    "slug" "text" NOT NULL,
    "total_donations_count" integer DEFAULT 0,
    "total_amount_received" numeric DEFAULT 0,
    "this_month_count" integer DEFAULT 0,
    "this_month_amount" numeric DEFAULT 0,
    "service_categories" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "page_views" integer DEFAULT 0,
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "stats_last_updated" timestamp without time zone DEFAULT "now"(),
    "address_line1" "text",
    "address_line2" "text",
    "address_city" "text",
    "address_county" "text",
    "address_country" "text",
    "address_postcode" "text",
    "display_name" "text",
    "logo_absolute_url" "text",
    "profile_page_url" "text",
    "registration_number" "text",
    "website_url" "text",
    "email_address" "text",
    "keywords" "text",
    "page_short_name" "text",
    "sms_short_name" "text",
    "is_approved" boolean DEFAULT false,
    "show_in_search" boolean DEFAULT true,
    "date_added_to_justgiving" timestamp with time zone,
    "thankyou_message" "text",
    "impact_statement_what" "text",
    "impact_statement_why" "text",
    "country_code" "text" DEFAULT 'GB'::"text",
    "currency_code" "text" DEFAULT 'GBP'::"text",
    "mobile_appeals" "jsonb",
    "donation_display_amounts" "jsonb",
    "theme_colour" "jsonb",
    "categories_list" "jsonb",
    "enhanced_data_fetched_at" timestamp with time zone,
    "api_fetch_attempts" integer DEFAULT 0,
    "fts" "tsvector",
    "processed_to_org_cache" boolean DEFAULT false,
    "processed_to_org_cache_at" timestamp with time zone
);


ALTER TABLE "public"."justgiving_charity_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."justgiving_charity_cache" IS 'JustGiving charity cache with optimized RLS policies: public read access, authenticated write access';



COMMENT ON COLUMN "public"."justgiving_charity_cache"."donation_display_amounts" IS 'Suggested donation amounts from charity';



COMMENT ON COLUMN "public"."justgiving_charity_cache"."theme_colour" IS 'Charity brand color (RGB values)';



COMMENT ON COLUMN "public"."justgiving_charity_cache"."categories_list" IS 'Array of charity categories from JustGiving API';



COMMENT ON COLUMN "public"."justgiving_charity_cache"."enhanced_data_fetched_at" IS 'When enhanced data was last fetched from GetCharityById API';



COMMENT ON COLUMN "public"."justgiving_charity_cache"."api_fetch_attempts" IS 'Number of failed API attempts for this charity';



CREATE TABLE IF NOT EXISTS "public"."justgiving_cities_lookup" (
    "id" integer NOT NULL,
    "city" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."justgiving_cities_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."justgiving_cities_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."justgiving_cities_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."justgiving_cities_lookup_id_seq" OWNED BY "public"."justgiving_cities_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."justgiving_countries_lookup" (
    "id" integer NOT NULL,
    "country" "text" NOT NULL,
    "organization_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."justgiving_countries_lookup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."justgiving_countries_lookup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."justgiving_countries_lookup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."justgiving_countries_lookup_id_seq" OWNED BY "public"."justgiving_countries_lookup"."id";



CREATE TABLE IF NOT EXISTS "public"."organization_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "public"."donation_platform" NOT NULL,
    "external_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "logo_url" "text",
    "slug" "text" NOT NULL,
    "total_donations_count" integer DEFAULT 0,
    "total_amount_received" numeric DEFAULT 0,
    "this_month_count" integer DEFAULT 0,
    "this_month_amount" numeric DEFAULT 0,
    "service_categories" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "page_views" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "stats_last_updated" timestamp with time zone DEFAULT "now"(),
    "address_line1" "text",
    "address_line2" "text",
    "address_city" "text",
    "address_county" "text",
    "address_country" "text",
    "address_postcode" "text",
    "display_name" "text",
    "logo_absolute_url" "text",
    "profile_page_url" "text",
    "registration_number" "text",
    "website_url" "text",
    "email_address" "text",
    "keywords" "text",
    "page_short_name" "text",
    "sms_short_name" "text",
    "is_approved" boolean DEFAULT false,
    "show_in_search" boolean DEFAULT true,
    "date_added_to_justgiving" timestamp with time zone,
    "thankyou_message" "text",
    "impact_statement_what" "text",
    "impact_statement_why" "text",
    "country_code" "text" DEFAULT 'GB'::"text",
    "currency_code" "text" DEFAULT 'GBP'::"text",
    "mobile_appeals" "jsonb",
    "donation_display_amounts" "jsonb",
    "theme_colour" "jsonb",
    "categories_list" "jsonb",
    "enhanced_data_fetched_at" timestamp with time zone,
    "api_fetch_attempts" integer DEFAULT 0,
    "fts" "tsvector",
    "acnc_abn" "text",
    "acnc_charity_legal_name" "text",
    "acnc_other_organisation_names" "text",
    "acnc_address_type" "text",
    "acnc_registration_date" "text",
    "acnc_date_organisation_established" "text",
    "acnc_charity_size" "text",
    "acnc_number_of_responsible_persons" "text",
    "acnc_financial_year_end" "text",
    "acnc_operates_in_act" "text",
    "acnc_operates_in_nsw" "text",
    "acnc_operates_in_nt" "text",
    "acnc_operates_in_qld" "text",
    "acnc_operates_in_sa" "text",
    "acnc_operates_in_tas" "text",
    "acnc_operates_in_vic" "text",
    "acnc_operates_in_wa" "text",
    "acnc_operating_countries" "text",
    "acnc_pbi" "text",
    "acnc_hpc" "text",
    "acnc_purposes" "jsonb" DEFAULT '{}'::"jsonb",
    "acnc_beneficiaries" "jsonb" DEFAULT '{}'::"jsonb",
    "show_on_platform" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."organization_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_cache" IS 'Unified cache table for organizations from all donation platforms (JustGiving, Every.org). Replaces platform-specific cache tables.';



COMMENT ON COLUMN "public"."organization_cache"."platform" IS 'Donation platform: justgiving, everyorg, or acnc';



COMMENT ON COLUMN "public"."organization_cache"."external_id" IS 'Platform-specific ID (justgiving_charity_id or nonprofit_ein)';



COMMENT ON COLUMN "public"."organization_cache"."slug" IS 'URL-friendly unique identifier for the organization within its platform';



COMMENT ON COLUMN "public"."organization_cache"."acnc_abn" IS 'Australian Business Number for ACNC registered charities';



COMMENT ON COLUMN "public"."organization_cache"."acnc_charity_legal_name" IS 'Official legal name from ACNC register';



COMMENT ON COLUMN "public"."organization_cache"."acnc_purposes" IS 'JSONB storing ACNC charity purposes (advancing_education, advancing_health, etc.)';



COMMENT ON COLUMN "public"."organization_cache"."acnc_beneficiaries" IS 'JSONB storing ACNC beneficiary groups (children, aged_persons, etc.)';



COMMENT ON COLUMN "public"."organization_cache"."show_on_platform" IS 'Boolean flag to control whether organization appears in public listings. Updated daily by cron job based on data quality rules (e.g., JustGiving orgs without descriptions are hidden).';



CREATE TABLE IF NOT EXISTS "public"."platform_stats" (
    "id" integer NOT NULL,
    "services_count" integer DEFAULT 0 NOT NULL,
    "justgiving_count" integer DEFAULT 0 NOT NULL,
    "everyorg_count" integer DEFAULT 0 NOT NULL,
    "acnc_count" integer DEFAULT 0 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."platform_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."platform_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."platform_stats_id_seq" OWNED BY "public"."platform_stats"."id";



CREATE TABLE IF NOT EXISTS "public"."pricing_tiers" (
    "id" integer NOT NULL,
    "tier_name" "text" NOT NULL,
    "tier_order" integer NOT NULL,
    "use_case" "text" NOT NULL,
    "price_aud" numeric(10,2) NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "price_eur" numeric(10,2) NOT NULL,
    "price_gbp" numeric(10,2) NOT NULL,
    "price_cad" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_tiers" OWNER TO "postgres";


COMMENT ON TABLE "public"."pricing_tiers" IS 'Standardized pricing tiers for services with multi-currency support';



COMMENT ON COLUMN "public"."pricing_tiers"."tier_order" IS 'Order for displaying tiers (1 = lowest, 6 = highest)';



COMMENT ON COLUMN "public"."pricing_tiers"."use_case" IS 'Description of what this tier is suitable for';



CREATE SEQUENCE IF NOT EXISTS "public"."pricing_tiers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pricing_tiers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pricing_tiers_id_seq" OWNED BY "public"."pricing_tiers"."id";



CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "donor_id" "uuid",
    "fundraiser_id" "uuid",
    "service_id" "uuid",
    "justgiving_charity_id" "text" NOT NULL,
    "donation_amount" numeric NOT NULL,
    "charity_name" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "donor_satisfaction" "text",
    "fundraiser_feedback_response" "text",
    "satisfaction_check_sent_at" timestamp with time zone,
    "donor_responded_at" timestamp with time zone,
    "fundraiser_feedback_sent_at" timestamp with time zone,
    "fundraiser_responded_at" timestamp with time zone,
    "fundraiser_rates_donor" "text",
    "donor_rates_fundraiser" "text",
    "donor_rates_service" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "platform" "public"."donation_platform" DEFAULT 'justgiving'::"public"."donation_platform",
    "reference_id" "text",
    "organization_id" "text",
    "organization_name" "text",
    "donation_url" "text",
    "external_donation_id" "text",
    "timeout_at" timestamp with time zone,
    CONSTRAINT "service_requests_donor_rates_fundraiser_check" CHECK (("donor_rates_fundraiser" = ANY (ARRAY['happy'::"text", 'unhappy'::"text"]))),
    CONSTRAINT "service_requests_donor_rates_service_check" CHECK (("donor_rates_service" = ANY (ARRAY['happy'::"text", 'unhappy'::"text"]))),
    CONSTRAINT "service_requests_donor_satisfaction_check" CHECK (("donor_satisfaction" = ANY (ARRAY['happy'::"text", 'unhappy'::"text", 'timeout'::"text"]))),
    CONSTRAINT "service_requests_fundraiser_feedback_response_check" CHECK (("fundraiser_feedback_response" = ANY (ARRAY['will_improve'::"text", 'disagree'::"text", 'timeout'::"text"]))),
    CONSTRAINT "service_requests_fundraiser_rates_donor_check" CHECK (("fundraiser_rates_donor" = ANY (ARRAY['happy'::"text", 'unhappy'::"text"]))),
    CONSTRAINT "service_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'provider_review'::"text", 'acknowledged_feedback'::"text", 'disputed_feedback'::"text", 'unresponsive_to_feedback'::"text"])))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."service_requests" IS 'Donation requests between donors and fundraisers';



COMMENT ON COLUMN "public"."service_requests"."donor_id" IS 'User making the donation (was supporter_id)';



COMMENT ON COLUMN "public"."service_requests"."fundraiser_id" IS 'User providing the service (was provider_id)';



COMMENT ON COLUMN "public"."service_requests"."donor_satisfaction" IS 'Donor satisfaction rating (was supporter_satisfaction)';



COMMENT ON COLUMN "public"."service_requests"."fundraiser_feedback_response" IS 'Fundraiser response to feedback (was provider_feedback_response)';



COMMENT ON COLUMN "public"."service_requests"."donor_responded_at" IS 'When donor responded to satisfaction check (was supporter_responded_at)';



COMMENT ON COLUMN "public"."service_requests"."fundraiser_feedback_sent_at" IS 'When fundraiser feedback was sent (was provider_feedback_sent_at)';



COMMENT ON COLUMN "public"."service_requests"."fundraiser_responded_at" IS 'When fundraiser responded (was provider_responded_at)';



COMMENT ON COLUMN "public"."service_requests"."fundraiser_rates_donor" IS 'Fundraiser rating of donor experience (was provider_rates_supporter)';



COMMENT ON COLUMN "public"."service_requests"."donor_rates_fundraiser" IS 'Donor rating of fundraiser experience (was supporter_rates_provider)';



COMMENT ON COLUMN "public"."service_requests"."donor_rates_service" IS 'Donor rating of service quality (was supporter_rates_service)';



COMMENT ON COLUMN "public"."service_requests"."platform" IS 'Platform used for this donation request';



COMMENT ON COLUMN "public"."service_requests"."reference_id" IS 'Unique platform reference (PD-JG-1000, PD-EV-1000)';



COMMENT ON COLUMN "public"."service_requests"."organization_id" IS 'Platform-specific organization ID';



COMMENT ON COLUMN "public"."service_requests"."organization_name" IS 'Cached organization name';



COMMENT ON COLUMN "public"."service_requests"."donation_url" IS 'Generated donation URL for platform';



COMMENT ON COLUMN "public"."service_requests"."external_donation_id" IS 'Platform''s donation ID after completion';



COMMENT ON COLUMN "public"."service_requests"."timeout_at" IS 'When to timeout pending donations (30min after creation)';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "donation_amount" numeric NOT NULL,
    "charity_requirement_type" "text" NOT NULL,
    "preferred_charities" "jsonb",
    "available_from" "date" NOT NULL,
    "available_until" "date",
    "max_donors" integer,
    "current_donors" integer DEFAULT 0,
    "service_locations" "jsonb" NOT NULL,
    "show_in_directory" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pricing_tier_id" integer,
    "platform" "public"."donation_platform" DEFAULT 'justgiving'::"public"."donation_platform",
    "organization_id" "text",
    "organization_name" "text",
    "organization_data" "jsonb",
    "platform_requirements" "jsonb",
    CONSTRAINT "chk_services_have_tier" CHECK (("pricing_tier_id" IS NOT NULL)),
    CONSTRAINT "services_charity_requirement_type_check" CHECK (("charity_requirement_type" = ANY (ARRAY['any_charity'::"text", 'specific_charities'::"text"]))),
    CONSTRAINT "services_platform_requirements_check" CHECK ((("platform_requirements" IS NULL) OR (("platform_requirements" ? 'type'::"text") AND ("platform_requirements" ? 'allowed_platforms'::"text") AND ("platform_requirements" ? 'platform_rules'::"text"))))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


COMMENT ON TABLE "public"."services" IS 'Services offered by fundraiser users';



COMMENT ON COLUMN "public"."services"."user_id" IS 'References users table (must be a fundraiser)';



COMMENT ON COLUMN "public"."services"."donation_amount" IS 'Always AUD amount from selected pricing tier';



COMMENT ON COLUMN "public"."services"."max_donors" IS 'Maximum number of donors for this service (was max_supporters)';



COMMENT ON COLUMN "public"."services"."current_donors" IS 'Current number of donors for this service (was current_supporters)';



COMMENT ON COLUMN "public"."services"."platform" IS 'Platform this service uses for donations';



COMMENT ON COLUMN "public"."services"."organization_id" IS 'Platform-specific charity/nonprofit ID';



COMMENT ON COLUMN "public"."services"."organization_name" IS 'Cached organization name for display';



COMMENT ON COLUMN "public"."services"."organization_data" IS 'Full platform organization data (JSON)';



COMMENT ON COLUMN "public"."services"."platform_requirements" IS 'JSONB field storing multi-platform organization requirements - replaces legacy charity_requirement_type system';



CREATE OR REPLACE VIEW "public"."public_donation_activity" WITH ("security_invoker"='true') AS
 SELECT "sr"."donation_amount",
    "s"."title" AS "service_title",
    "cc"."name" AS "charity_name",
    "sr"."created_at",
    'Anonymous'::"text" AS "donor_name"
   FROM (("public"."service_requests" "sr"
     JOIN "public"."services" "s" ON (("sr"."service_id" = "s"."id")))
     JOIN "public"."justgiving_charity_cache" "cc" ON (("sr"."justgiving_charity_id" = "cc"."justgiving_charity_id")))
  WHERE ("sr"."status" = ANY (ARRAY['success'::"text", 'acknowledged_feedback'::"text"]))
  ORDER BY "sr"."created_at" DESC
 LIMIT 50;


ALTER VIEW "public"."public_donation_activity" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_donation_activity" IS 'Public anonymous donation activity - uses caller permissions, not SECURITY DEFINER';



CREATE OR REPLACE VIEW "public"."public_platform_stats" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_services",
    "count"(DISTINCT "user_id") AS "total_fundraisers",
    "count"(*) FILTER (WHERE ("created_at" >= "date_trunc"('month'::"text", "now"()))) AS "services_this_month"
   FROM "public"."services"
  WHERE (("is_active" = true) AND ("show_in_directory" = true));


ALTER VIEW "public"."public_platform_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_platform_stats" IS 'Public aggregate statistics - uses caller permissions, not SECURITY DEFINER';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "username" "text",
    "is_fundraiser" boolean DEFAULT false,
    "is_donor" boolean DEFAULT true,
    "bio" "text",
    "location" "text",
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "preferred_currency" "public"."currency_code" DEFAULT 'GBP'::"public"."currency_code",
    "preferred_platform" "public"."donation_platform" DEFAULT 'justgiving'::"public"."donation_platform"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Unified users table combining fundraisers and donors';



COMMENT ON COLUMN "public"."users"."username" IS 'Optional unique username for profiles';



COMMENT ON COLUMN "public"."users"."is_fundraiser" IS 'True if user offers services (was is_provider)';



COMMENT ON COLUMN "public"."users"."is_donor" IS 'True if user can make donations - default (was is_supporter)';



COMMENT ON COLUMN "public"."users"."preferred_currency" IS 'User preferred currency for donations and pricing display';



COMMENT ON COLUMN "public"."users"."preferred_platform" IS 'User''s preferred donation platform (defaults to JustGiving)';



ALTER TABLE ONLY "public"."acnc_beneficiaries_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_beneficiaries_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acnc_categories_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_categories_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acnc_cities_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_cities_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acnc_operating_countries_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_operating_countries_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acnc_purposes_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_purposes_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."acnc_states_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."acnc_states_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."everyorg_categories_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."everyorg_categories_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."justgiving_cities_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."justgiving_cities_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."justgiving_countries_lookup" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."justgiving_countries_lookup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."platform_stats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."platform_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pricing_tiers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pricing_tiers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ACNC_Registered_Charities"
    ADD CONSTRAINT "ACNC_Registered_Charities_pkey" PRIMARY KEY ("ABN");



ALTER TABLE ONLY "public"."JustGivingCharityNames"
    ADD CONSTRAINT "JustGivingCharityNames_pkey" PRIMARY KEY ("Charity_Name");



ALTER TABLE ONLY "public"."acnc_beneficiaries_lookup"
    ADD CONSTRAINT "acnc_beneficiaries_lookup_beneficiary_key" UNIQUE ("beneficiary");



ALTER TABLE ONLY "public"."acnc_beneficiaries_lookup"
    ADD CONSTRAINT "acnc_beneficiaries_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_categories_lookup"
    ADD CONSTRAINT "acnc_categories_lookup_category_key" UNIQUE ("category");



ALTER TABLE ONLY "public"."acnc_categories_lookup"
    ADD CONSTRAINT "acnc_categories_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_cities_lookup"
    ADD CONSTRAINT "acnc_cities_lookup_city_key" UNIQUE ("city");



ALTER TABLE ONLY "public"."acnc_cities_lookup"
    ADD CONSTRAINT "acnc_cities_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_cron_logs"
    ADD CONSTRAINT "acnc_cron_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_operating_countries_lookup"
    ADD CONSTRAINT "acnc_operating_countries_lookup_country_key" UNIQUE ("country");



ALTER TABLE ONLY "public"."acnc_operating_countries_lookup"
    ADD CONSTRAINT "acnc_operating_countries_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_purposes_lookup"
    ADD CONSTRAINT "acnc_purposes_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_purposes_lookup"
    ADD CONSTRAINT "acnc_purposes_lookup_purpose_key" UNIQUE ("purpose");



ALTER TABLE ONLY "public"."acnc_states_lookup"
    ADD CONSTRAINT "acnc_states_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acnc_states_lookup"
    ADD CONSTRAINT "acnc_states_lookup_state_key" UNIQUE ("state");



ALTER TABLE ONLY "public"."justgiving_charity_cache"
    ADD CONSTRAINT "charity_cache_pkey" PRIMARY KEY ("justgiving_charity_id");



ALTER TABLE ONLY "public"."justgiving_charity_cache"
    ADD CONSTRAINT "charity_cache_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."every_org_nonprofit_cache"
    ADD CONSTRAINT "every_org_nonprofit_cache_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."everyorg_categories_lookup"
    ADD CONSTRAINT "everyorg_categories_lookup_category_key" UNIQUE ("category");



ALTER TABLE ONLY "public"."everyorg_categories_lookup"
    ADD CONSTRAINT "everyorg_categories_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."justgiving_cities_lookup"
    ADD CONSTRAINT "justgiving_cities_lookup_city_key" UNIQUE ("city");



ALTER TABLE ONLY "public"."justgiving_cities_lookup"
    ADD CONSTRAINT "justgiving_cities_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."justgiving_countries_lookup"
    ADD CONSTRAINT "justgiving_countries_lookup_country_key" UNIQUE ("country");



ALTER TABLE ONLY "public"."justgiving_countries_lookup"
    ADD CONSTRAINT "justgiving_countries_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_cache"
    ADD CONSTRAINT "organization_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_cache"
    ADD CONSTRAINT "organization_cache_platform_external_id_unique" UNIQUE ("platform", "external_id");



ALTER TABLE ONLY "public"."organization_cache"
    ADD CONSTRAINT "organization_cache_platform_slug_unique" UNIQUE ("platform", "slug");



ALTER TABLE ONLY "public"."platform_stats"
    ADD CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_tiers"
    ADD CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_tiers"
    ADD CONSTRAINT "pricing_tiers_tier_name_key" UNIQUE ("tier_name");



ALTER TABLE ONLY "public"."pricing_tiers"
    ADD CONSTRAINT "pricing_tiers_tier_order_key" UNIQUE ("tier_order");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_reference_id_key" UNIQUE ("reference_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



CREATE INDEX "idx_acnc_beneficiaries_lookup_beneficiary" ON "public"."acnc_beneficiaries_lookup" USING "btree" ("beneficiary");



CREATE INDEX "idx_acnc_categories_lookup_category" ON "public"."acnc_categories_lookup" USING "btree" ("category");



CREATE INDEX "idx_acnc_cities_lookup_city" ON "public"."acnc_cities_lookup" USING "btree" ("city");



CREATE INDEX "idx_acnc_cron_logs_execution_time" ON "public"."acnc_cron_logs" USING "btree" ("execution_time" DESC);



CREATE INDEX "idx_acnc_cron_logs_status" ON "public"."acnc_cron_logs" USING "btree" ("status");



CREATE INDEX "idx_acnc_operating_countries_lookup_country" ON "public"."acnc_operating_countries_lookup" USING "btree" ("country");



CREATE INDEX "idx_acnc_purposes_lookup_purpose" ON "public"."acnc_purposes_lookup" USING "btree" ("purpose");



CREATE INDEX "idx_acnc_states_lookup_state" ON "public"."acnc_states_lookup" USING "btree" ("state");



CREATE INDEX "idx_charity_cache_active" ON "public"."justgiving_charity_cache" USING "btree" ("is_active");



CREATE INDEX "idx_charity_cache_slug" ON "public"."justgiving_charity_cache" USING "btree" ("slug");



CREATE INDEX "idx_every_org_nonprofit_cache_active" ON "public"."every_org_nonprofit_cache" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_every_org_nonprofit_cache_ein" ON "public"."every_org_nonprofit_cache" USING "btree" ("nonprofit_ein") WHERE ("nonprofit_ein" IS NOT NULL);



CREATE INDEX "idx_every_org_nonprofit_cache_featured" ON "public"."every_org_nonprofit_cache" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_every_org_nonprofit_cache_slug" ON "public"."every_org_nonprofit_cache" USING "btree" ("slug");



CREATE INDEX "idx_everyorg_categories_lookup_category" ON "public"."everyorg_categories_lookup" USING "btree" ("category");



CREATE INDEX "idx_exchange_rates_currencies_time" ON "public"."exchange_rates" USING "btree" ("from_currency", "to_currency", "created_at" DESC);



CREATE UNIQUE INDEX "idx_exchange_rates_unique_hour" ON "public"."exchange_rates" USING "btree" ("from_currency", "to_currency", "date_trunc"('hour'::"text", "created_at"));



CREATE INDEX "idx_jg_cache_org_migration" ON "public"."justgiving_charity_cache" USING "btree" ("processed_to_org_cache", "last_updated");



CREATE INDEX "idx_jg_cache_processed" ON "public"."justgiving_charity_cache" USING "btree" ("processed_to_org_cache");



CREATE INDEX "idx_justgiving_charity_cache_active_approved" ON "public"."justgiving_charity_cache" USING "btree" ("is_active", "is_approved");



CREATE INDEX "idx_justgiving_charity_cache_approved" ON "public"."justgiving_charity_cache" USING "btree" ("is_approved") WHERE ("is_approved" = true);



CREATE INDEX "idx_justgiving_charity_cache_category" ON "public"."justgiving_charity_cache" USING "btree" ("category");



COMMENT ON INDEX "public"."idx_justgiving_charity_cache_category" IS 'Supports category filtering';



CREATE INDEX "idx_justgiving_charity_cache_country" ON "public"."justgiving_charity_cache" USING "btree" ("address_country");



COMMENT ON INDEX "public"."idx_justgiving_charity_cache_country" IS 'Supports enhanced data country filtering';



CREATE INDEX "idx_justgiving_charity_cache_country_code" ON "public"."justgiving_charity_cache" USING "btree" ("country_code");



COMMENT ON INDEX "public"."idx_justgiving_charity_cache_country_code" IS 'Supports basic country code filtering';



CREATE INDEX "idx_justgiving_charity_cache_enhanced" ON "public"."justgiving_charity_cache" USING "btree" ("enhanced_data_fetched_at") WHERE ("enhanced_data_fetched_at" IS NOT NULL);



CREATE INDEX "idx_justgiving_charity_cache_name" ON "public"."justgiving_charity_cache" USING "btree" ("name");



COMMENT ON INDEX "public"."idx_justgiving_charity_cache_name" IS 'Supports ORDER BY name queries';



CREATE INDEX "idx_justgiving_charity_cache_page_short_name" ON "public"."justgiving_charity_cache" USING "btree" ("page_short_name") WHERE ("page_short_name" IS NOT NULL);



CREATE INDEX "idx_justgiving_charity_cache_registration" ON "public"."justgiving_charity_cache" USING "btree" ("registration_number") WHERE ("registration_number" IS NOT NULL);



CREATE INDEX "idx_justgiving_charity_cache_stats" ON "public"."justgiving_charity_cache" USING "btree" ("total_donations_count", "total_amount_received");



CREATE INDEX "idx_justgiving_charity_cache_text_search" ON "public"."justgiving_charity_cache" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("keywords", ''::"text")) || ' '::"text") || COALESCE("address_city", ''::"text"))));



COMMENT ON INDEX "public"."idx_justgiving_charity_cache_text_search" IS 'Supports full-text search across name, description, keywords, and location';



CREATE INDEX "idx_justgiving_charity_names_cache_status" ON "public"."JustGivingCharityNames" USING "btree" ("charity_id", "add_to_cache_date");



CREATE INDEX "idx_justgiving_charity_names_charity_id" ON "public"."JustGivingCharityNames" USING "btree" ("charity_id");



CREATE INDEX "idx_justgiving_charity_names_query_datetime" ON "public"."JustGivingCharityNames" USING "btree" ("query_datetime");



CREATE INDEX "idx_justgiving_cities_lookup_city" ON "public"."justgiving_cities_lookup" USING "btree" ("city");



CREATE INDEX "idx_justgiving_countries_lookup_country" ON "public"."justgiving_countries_lookup" USING "btree" ("country");



CREATE INDEX "idx_organization_cache_acnc_abn" ON "public"."organization_cache" USING "btree" ("acnc_abn");



CREATE INDEX "idx_organization_cache_acnc_size" ON "public"."organization_cache" USING "btree" ("acnc_charity_size");



CREATE INDEX "idx_organization_cache_acnc_state" ON "public"."organization_cache" USING "btree" ("acnc_operates_in_nsw", "acnc_operates_in_vic", "acnc_operates_in_qld");



CREATE INDEX "idx_organization_cache_address_city" ON "public"."organization_cache" USING "btree" ("address_city");



CREATE INDEX "idx_organization_cache_all_states_active" ON "public"."organization_cache" USING "btree" ("platform", "acnc_operates_in_nsw", "acnc_operates_in_vic", "acnc_operates_in_qld", "acnc_operates_in_sa", "acnc_operates_in_wa", "acnc_operates_in_tas", "acnc_operates_in_nt", "acnc_operates_in_act", "is_active") WHERE ("platform" = 'justgiving'::"public"."donation_platform");



CREATE INDEX "idx_organization_cache_api_processing" ON "public"."organization_cache" USING "btree" ("platform", "api_fetch_attempts", "last_updated") WHERE (("enhanced_data_fetched_at" IS NULL) AND ("api_fetch_attempts" < 3));



CREATE INDEX "idx_organization_cache_beneficiaries_countries" ON "public"."organization_cache" USING "btree" ("platform", "acnc_operating_countries", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_beneficiaries" IS NOT NULL) AND ("acnc_operating_countries" IS NOT NULL));



CREATE INDEX "idx_organization_cache_beneficiaries_gin" ON "public"."organization_cache" USING "gin" ("acnc_beneficiaries") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_beneficiaries" IS NOT NULL));



CREATE INDEX "idx_organization_cache_category" ON "public"."organization_cache" USING "btree" ("category");



CREATE INDEX "idx_organization_cache_category_sort" ON "public"."organization_cache" USING "btree" ("platform", "is_active", "show_on_platform", "category", "is_featured" DESC, "total_donations_count" DESC, "name", "id");



CREATE INDEX "idx_organization_cache_category_state" ON "public"."organization_cache" USING "btree" ("platform", "category", "acnc_operates_in_nsw", "acnc_operates_in_vic", "acnc_operates_in_qld", "acnc_operates_in_sa", "acnc_operates_in_wa", "acnc_operates_in_tas", "acnc_operates_in_nt", "acnc_operates_in_act", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("category" IS NOT NULL));



CREATE INDEX "idx_organization_cache_city_sort" ON "public"."organization_cache" USING "btree" ("platform", "is_active", "show_on_platform", "address_city", "is_featured" DESC, "total_donations_count" DESC, "name", "id");



CREATE INDEX "idx_organization_cache_comprehensive_filter" ON "public"."organization_cache" USING "btree" ("platform", "category", "address_city", "country_code", "acnc_operates_in_nsw", "acnc_operates_in_vic", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("is_active" = true));



CREATE INDEX "idx_organization_cache_country_code" ON "public"."organization_cache" USING "btree" ("country_code");



CREATE INDEX "idx_organization_cache_enhanced_data" ON "public"."organization_cache" USING "btree" ("platform", "enhanced_data_fetched_at" DESC) WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("enhanced_data_fetched_at" IS NOT NULL));



CREATE INDEX "idx_organization_cache_external_id" ON "public"."organization_cache" USING "btree" ("external_id");



CREATE INDEX "idx_organization_cache_fts" ON "public"."organization_cache" USING "gin" ("fts");



CREATE INDEX "idx_organization_cache_is_active" ON "public"."organization_cache" USING "btree" ("is_active");



CREATE INDEX "idx_organization_cache_is_featured" ON "public"."organization_cache" USING "btree" ("is_featured");



CREATE INDEX "idx_organization_cache_location_beneficiaries" ON "public"."organization_cache" USING "btree" ("platform", "address_city", "address_country", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_beneficiaries" IS NOT NULL));



CREATE INDEX "idx_organization_cache_location_comprehensive" ON "public"."organization_cache" USING "btree" ("platform", "address_city", "address_county", "address_country", "country_code", "is_active") WHERE ("address_city" IS NOT NULL);



CREATE INDEX "idx_organization_cache_operating_countries" ON "public"."organization_cache" USING "btree" ("platform", "acnc_operating_countries", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_operating_countries" IS NOT NULL));



CREATE INDEX "idx_organization_cache_platform" ON "public"."organization_cache" USING "btree" ("platform");



CREATE INDEX "idx_organization_cache_platform_active" ON "public"."organization_cache" USING "btree" ("platform", "is_active");



CREATE INDEX "idx_organization_cache_platform_category" ON "public"."organization_cache" USING "btree" ("platform", "category");



CREATE INDEX "idx_organization_cache_platform_category_active" ON "public"."organization_cache" USING "btree" ("platform", "category", "is_active") WHERE ("category" IS NOT NULL);



CREATE INDEX "idx_organization_cache_platform_city" ON "public"."organization_cache" USING "btree" ("platform", "address_city");



CREATE INDEX "idx_organization_cache_platform_city_category" ON "public"."organization_cache" USING "btree" ("platform", "address_city", "category") WHERE ("is_active" = true);



CREATE INDEX "idx_organization_cache_platform_country_active" ON "public"."organization_cache" USING "btree" ("platform", "country_code", "is_active") WHERE ("country_code" IS NOT NULL);



CREATE INDEX "idx_organization_cache_platform_external_id_active" ON "public"."organization_cache" USING "btree" ("platform", "external_id", "is_active");



CREATE INDEX "idx_organization_cache_platform_search_active" ON "public"."organization_cache" USING "btree" ("platform", "is_active") WHERE ("fts" IS NOT NULL);



CREATE INDEX "idx_organization_cache_platform_show_on_platform" ON "public"."organization_cache" USING "btree" ("platform", "show_on_platform", "is_active");



CREATE INDEX "idx_organization_cache_platform_stats" ON "public"."organization_cache" USING "btree" ("platform", "is_active", "total_donations_count" DESC, "this_month_count" DESC) WHERE ("total_donations_count" > 0);



CREATE INDEX "idx_organization_cache_purpose_location" ON "public"."organization_cache" USING "btree" ("platform", "address_city", "country_code", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_purposes" IS NOT NULL) AND ("address_city" IS NOT NULL));



CREATE INDEX "idx_organization_cache_purposes_gin" ON "public"."organization_cache" USING "gin" ("acnc_purposes") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_purposes" IS NOT NULL));



CREATE INDEX "idx_organization_cache_show_on_platform" ON "public"."organization_cache" USING "btree" ("show_on_platform");



CREATE INDEX "idx_organization_cache_slug" ON "public"."organization_cache" USING "btree" ("slug");



CREATE INDEX "idx_organization_cache_sort_optimized" ON "public"."organization_cache" USING "btree" ("platform", "is_active", "show_on_platform", "is_featured" DESC, "total_donations_count" DESC, "name", "id");



CREATE INDEX "idx_organization_cache_state_purpose" ON "public"."organization_cache" USING "btree" ("platform", "acnc_operates_in_nsw", "acnc_operates_in_vic", "acnc_operates_in_qld", "is_active") WHERE (("platform" = 'justgiving'::"public"."donation_platform") AND ("acnc_purposes" IS NOT NULL));



CREATE INDEX "idx_platform_stats_last_updated" ON "public"."platform_stats" USING "btree" ("last_updated" DESC);



CREATE INDEX "idx_pricing_tiers_active" ON "public"."pricing_tiers" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_pricing_tiers_order" ON "public"."pricing_tiers" USING "btree" ("tier_order");



CREATE INDEX "idx_service_requests_created_at" ON "public"."service_requests" USING "btree" ("created_at");



CREATE INDEX "idx_service_requests_donor_id" ON "public"."service_requests" USING "btree" ("donor_id");



CREATE INDEX "idx_service_requests_fundraiser_id" ON "public"."service_requests" USING "btree" ("fundraiser_id");



CREATE INDEX "idx_service_requests_organization_id" ON "public"."service_requests" USING "btree" ("organization_id");



CREATE INDEX "idx_service_requests_platform" ON "public"."service_requests" USING "btree" ("platform");



CREATE INDEX "idx_service_requests_reference_id" ON "public"."service_requests" USING "btree" ("reference_id");



CREATE INDEX "idx_service_requests_service_id" ON "public"."service_requests" USING "btree" ("service_id");



CREATE INDEX "idx_service_requests_status" ON "public"."service_requests" USING "btree" ("status");



CREATE INDEX "idx_service_requests_status_timeout" ON "public"."service_requests" USING "btree" ("status", "timeout_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_services_available_from" ON "public"."services" USING "btree" ("available_from");



CREATE INDEX "idx_services_created_at" ON "public"."services" USING "btree" ("created_at");



CREATE INDEX "idx_services_donation_amount" ON "public"."services" USING "btree" ("donation_amount");



CREATE INDEX "idx_services_is_active" ON "public"."services" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_services_organization_id" ON "public"."services" USING "btree" ("organization_id");



CREATE INDEX "idx_services_platform" ON "public"."services" USING "btree" ("platform");



CREATE INDEX "idx_services_platform_active" ON "public"."services" USING "btree" ("platform", "is_active", "show_in_directory");



CREATE INDEX "idx_services_platform_requirements" ON "public"."services" USING "gin" ("platform_requirements");



CREATE INDEX "idx_services_pricing_tier_id" ON "public"."services" USING "btree" ("pricing_tier_id");



CREATE INDEX "idx_services_show_in_directory" ON "public"."services" USING "btree" ("show_in_directory") WHERE ("show_in_directory" = true);



CREATE INDEX "idx_services_user_id" ON "public"."services" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_donor" ON "public"."users" USING "btree" ("is_donor") WHERE ("is_donor" = true);



CREATE INDEX "idx_users_is_fundraiser" ON "public"."users" USING "btree" ("is_fundraiser") WHERE ("is_fundraiser" = true);



CREATE INDEX "idx_users_location" ON "public"."users" USING "btree" ("location") WHERE ("location" IS NOT NULL);



CREATE INDEX "idx_users_preferred_platform" ON "public"."users" USING "btree" ("preferred_platform");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username") WHERE ("username" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trigger_charity_fts_update" BEFORE INSERT OR UPDATE ON "public"."justgiving_charity_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_charity_fts"();



CREATE OR REPLACE TRIGGER "trigger_update_organization_cache_fts" BEFORE INSERT OR UPDATE ON "public"."organization_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_organization_cache_fts"();



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pricing_tier_id_fkey" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."ACNC_Registered_Charities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ACNC_Registered_Charities_access_policy" ON "public"."ACNC_Registered_Charities" USING (
CASE
    WHEN (( SELECT "current_setting"('request.method'::"text", true) AS "current_setting") = 'GET'::"text") THEN true
    ELSE (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")
END);



CREATE POLICY "Allow public read access to acnc_beneficiaries_lookup" ON "public"."acnc_beneficiaries_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to acnc_categories_lookup" ON "public"."acnc_categories_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to acnc_cities_lookup" ON "public"."acnc_cities_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to acnc_operating_countries_lookup" ON "public"."acnc_operating_countries_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to acnc_purposes_lookup" ON "public"."acnc_purposes_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to acnc_states_lookup" ON "public"."acnc_states_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to everyorg_categories_lookup" ON "public"."everyorg_categories_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to justgiving_cities_lookup" ON "public"."justgiving_cities_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to justgiving_countries_lookup" ON "public"."justgiving_countries_lookup" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to platform stats" ON "public"."platform_stats" FOR SELECT USING (true);



CREATE POLICY "Allow service role to update platform stats" ON "public"."platform_stats" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Authenticated can delete charity cache" ON "public"."justgiving_charity_cache" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated can insert charity cache" ON "public"."justgiving_charity_cache" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated can update charity cache" ON "public"."justgiving_charity_cache" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Donors can insert service requests" ON "public"."service_requests" FOR INSERT WITH CHECK (("donor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Exchange rates are publicly readable" ON "public"."exchange_rates" FOR SELECT USING (true);



ALTER TABLE "public"."JustGivingCharityNames" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "JustGivingCharityNames_access_policy" ON "public"."JustGivingCharityNames" USING (
CASE
    WHEN (( SELECT "current_setting"('request.method'::"text", true) AS "current_setting") = 'GET'::"text") THEN true
    ELSE (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")
END);



CREATE POLICY "Public can view active pricing tiers" ON "public"."pricing_tiers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view charity cache" ON "public"."justgiving_charity_cache" FOR SELECT USING (true);



CREATE POLICY "Public can view every_org nonprofit cache" ON "public"."every_org_nonprofit_cache" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Service role can manage acnc cron logs" ON "public"."acnc_cron_logs" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Update service requests policy" ON "public"."service_requests" FOR UPDATE USING ((("donor_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("fundraiser_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("donor_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("fundraiser_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can delete their own profile" ON "public"."users" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can delete their own services" ON "public"."services" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert their own profile" ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own services" ON "public"."services" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own services" ON "public"."services" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view all profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "View service requests policy" ON "public"."service_requests" FOR SELECT USING ((("donor_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("fundraiser_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View services policy" ON "public"."services" FOR SELECT USING (((("is_active" = true) AND ("show_in_directory" = true)) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."acnc_beneficiaries_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_categories_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_cities_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_cron_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_operating_countries_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_purposes_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."acnc_states_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."every_org_nonprofit_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."everyorg_categories_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."justgiving_charity_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."justgiving_cities_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."justgiving_countries_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organization_cache_public_read" ON "public"."organization_cache" FOR SELECT USING (true);



CREATE POLICY "organization_cache_service_delete" ON "public"."organization_cache" FOR DELETE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "organization_cache_service_insert" ON "public"."organization_cache" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "organization_cache_service_update" ON "public"."organization_cache" FOR UPDATE USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."platform_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_donor_happiness"("donor_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_fundraiser_happiness"("fundraiser_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_service_happiness"("service_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_platform_reference"("platform_type" "public"."donation_platform") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_charity_processing_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_charity_processing_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_charity_processing_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_charity_batch"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_charity_batch"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_charity_batch"("batch_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_public_stats"("organization_slug" "text", "platform_type" "public"."donation_platform") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_charity_stats"("charity_id" "text", "amount" numeric, "service_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_meaningful_description"("description_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_meaningful_description"("description_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_meaningful_description"("description_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_all_acnc_charities"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_all_acnc_charities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_all_acnc_charities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_charity_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_charity_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_charity_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_acnc_population"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_acnc_population"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_acnc_population"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_happiness_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_happiness_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_happiness_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_charity_fts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_charity_fts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_charity_fts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_charity_processing_status"("charity_id_param" "text", "status_param" "text", "details_param" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_charity_processing_status"("charity_id_param" "text", "status_param" "text", "details_param" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_charity_processing_status"("charity_id_param" "text", "status_param" "text", "details_param" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organization_cache_fts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organization_cache_fts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organization_cache_fts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_platform_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_platform_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_platform_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer) TO "service_role";
























GRANT ALL ON TABLE "public"."ACNC_Registered_Charities" TO "anon";
GRANT ALL ON TABLE "public"."ACNC_Registered_Charities" TO "authenticated";
GRANT ALL ON TABLE "public"."ACNC_Registered_Charities" TO "service_role";



GRANT ALL ON TABLE "public"."JustGivingCharityNames" TO "anon";
GRANT ALL ON TABLE "public"."JustGivingCharityNames" TO "authenticated";
GRANT ALL ON TABLE "public"."JustGivingCharityNames" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_beneficiaries_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_beneficiaries_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_beneficiaries_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_beneficiaries_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_beneficiaries_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_beneficiaries_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_categories_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_categories_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_categories_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_categories_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_categories_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_categories_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_cities_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_cities_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_cities_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_cities_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_cities_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_cities_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_cron_logs" TO "anon";
GRANT ALL ON TABLE "public"."acnc_cron_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_cron_logs" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_operating_countries_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_operating_countries_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_operating_countries_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_operating_countries_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_operating_countries_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_operating_countries_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_purposes_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_purposes_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_purposes_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_purposes_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_purposes_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_purposes_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acnc_states_lookup" TO "anon";
GRANT ALL ON TABLE "public"."acnc_states_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."acnc_states_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."acnc_states_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."acnc_states_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."acnc_states_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."charity_processing_status" TO "anon";
GRANT ALL ON TABLE "public"."charity_processing_status" TO "authenticated";
GRANT ALL ON TABLE "public"."charity_processing_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."donation_reference_ev_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."donation_reference_ev_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."donation_reference_ev_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."donation_reference_jg_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."donation_reference_jg_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."donation_reference_jg_seq" TO "service_role";



GRANT ALL ON TABLE "public"."every_org_nonprofit_cache" TO "anon";
GRANT ALL ON TABLE "public"."every_org_nonprofit_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."every_org_nonprofit_cache" TO "service_role";



GRANT ALL ON TABLE "public"."everyorg_categories_lookup" TO "anon";
GRANT ALL ON TABLE "public"."everyorg_categories_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."everyorg_categories_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."everyorg_categories_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."everyorg_categories_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."everyorg_categories_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."justgiving_charity_cache" TO "anon";
GRANT ALL ON TABLE "public"."justgiving_charity_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."justgiving_charity_cache" TO "service_role";



GRANT ALL ON TABLE "public"."justgiving_cities_lookup" TO "anon";
GRANT ALL ON TABLE "public"."justgiving_cities_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."justgiving_cities_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."justgiving_cities_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."justgiving_cities_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."justgiving_cities_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."justgiving_countries_lookup" TO "anon";
GRANT ALL ON TABLE "public"."justgiving_countries_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."justgiving_countries_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."justgiving_countries_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."justgiving_countries_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."justgiving_countries_lookup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organization_cache" TO "anon";
GRANT ALL ON TABLE "public"."organization_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_cache" TO "service_role";



GRANT ALL ON TABLE "public"."platform_stats" TO "anon";
GRANT ALL ON TABLE "public"."platform_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."platform_stats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."platform_stats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."platform_stats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_tiers" TO "anon";
GRANT ALL ON TABLE "public"."pricing_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_tiers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pricing_tiers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pricing_tiers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pricing_tiers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."public_donation_activity" TO "anon";
GRANT ALL ON TABLE "public"."public_donation_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."public_donation_activity" TO "service_role";
GRANT SELECT ON TABLE "public"."public_donation_activity" TO PUBLIC;



GRANT ALL ON TABLE "public"."public_platform_stats" TO "anon";
GRANT ALL ON TABLE "public"."public_platform_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."public_platform_stats" TO "service_role";
GRANT SELECT ON TABLE "public"."public_platform_stats" TO PUBLIC;



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
