-- Fix search_path security for database functions
-- Addresses Supabase linter warnings: function_search_path_mutable

-- Fix populate_lookup_tables_direct function
CREATE OR REPLACE FUNCTION "public"."populate_lookup_tables_direct"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
    AS $$
DECLARE
  org_record RECORD;
BEGIN
  -- Clear existing lookup table data
  DELETE FROM location_lookup;
  DELETE FROM category_lookup;
  DELETE FROM beneficiary_lookup;

  -- Populate location_lookup with unique locations
  INSERT INTO location_lookup (location)
  SELECT DISTINCT TRIM(location)
  FROM organization_cache 
  WHERE location IS NOT NULL 
    AND TRIM(location) != '' 
    AND show_on_platform = true;

  -- Populate category_lookup with unique categories
  INSERT INTO category_lookup (category)
  SELECT DISTINCT TRIM(category)
  FROM organization_cache 
  WHERE category IS NOT NULL 
    AND TRIM(category) != '' 
    AND show_on_platform = true;

  -- Populate beneficiary_lookup with unique beneficiaries
  INSERT INTO beneficiary_lookup (beneficiary)
  SELECT DISTINCT TRIM(beneficiary)
  FROM organization_cache 
  WHERE beneficiary IS NOT NULL 
    AND TRIM(beneficiary) != '' 
    AND show_on_platform = true;

  RAISE NOTICE 'Successfully populated all lookup tables';
END;
$$;

-- Fix is_meaningful_description function
CREATE OR REPLACE FUNCTION "public"."is_meaningful_description"("description_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    SET search_path = 'public'
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

    -- Return false if description is too short (less than 10 characters after trimming)
    IF LENGTH(TRIM(description_text)) < 10 THEN
      RETURN FALSE;
    END IF;

    -- Return false if description contains only common filler words
    IF LOWER(TRIM(description_text)) ~ '^(the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|above|below|up|down|out|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|can|will|just|should|now)+\s*$' THEN
      RETURN FALSE;
    END IF;

    -- If none of the above conditions are met, consider it meaningful
    RETURN TRUE;
  END;
$_$;

-- Fix update_show_on_platform_batch function
CREATE OR REPLACE FUNCTION "public"."update_show_on_platform_batch"("batch_size" integer DEFAULT 1000) RETURNS integer
    LANGUAGE "plpgsql"
    SET search_path = 'public'
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
          AND (
            -- Organizations with no meaningful description
            NOT is_meaningful_description(description)
            -- Add other criteria here as needed
          )
        LIMIT batch_size
      );
      
      GET DIAGNOSTICS updated_count = ROW_COUNT;
      total_updated := total_updated + updated_count;
      
      -- Exit loop if no more rows were updated
      EXIT WHEN updated_count = 0;
      
      -- Optional: Add a small delay to prevent overwhelming the database
      -- PERFORM pg_sleep(0.1);
    END LOOP;
    
    RETURN total_updated;
  END;
$$;

-- Ensure proper ownership and permissions are maintained
ALTER FUNCTION "public"."populate_lookup_tables_direct"() OWNER TO "postgres";
ALTER FUNCTION "public"."is_meaningful_description"("text") OWNER TO "postgres";
ALTER FUNCTION "public"."update_show_on_platform_batch"(integer) OWNER TO "postgres";

-- Maintain existing grants for populate_lookup_tables_direct
GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_lookup_tables_direct"() TO "service_role";

-- Maintain existing grants for is_meaningful_description
GRANT ALL ON FUNCTION "public"."is_meaningful_description"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_meaningful_description"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_meaningful_description"("text") TO "service_role";

-- Maintain existing grants for update_show_on_platform_batch
GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_show_on_platform_batch"(integer) TO "service_role";