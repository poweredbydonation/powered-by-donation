-- Final fix for is_meaningful_description function with correct regex syntax
-- and additional placeholder text filtering

DROP FUNCTION IF EXISTS is_meaningful_description(TEXT);

CREATE OR REPLACE FUNCTION is_meaningful_description(description_text TEXT) 
RETURNS BOOLEAN AS $$
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
  
  -- Return false if description is only repeated single characters (like "....." or "-----")
  IF TRIM(description_text) ~ '^(.)\1+$' AND LENGTH(TRIM(description_text)) <= 10 THEN
    RETURN FALSE;
  END IF;
  
  -- If all checks pass, description is meaningful
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 
  'Test Results:' as test_type,
  is_meaningful_description('.') as single_dot,
  is_meaningful_description('Created via charity sign up service.') as signup_service,
  is_meaningful_description('This is a proper charity description') as valid_desc;