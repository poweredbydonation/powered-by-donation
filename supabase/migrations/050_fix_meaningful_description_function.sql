-- Fix the is_meaningful_description function with correct regex syntax
-- The previous version had malformed regex patterns

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
    'to be determined', 'pending', 'update pending'
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

-- Test the function with common problematic cases
DO $$
BEGIN
  -- Test cases that should return FALSE
  ASSERT NOT is_meaningful_description('.') = TRUE, 'Single dot should be FALSE';
  ASSERT NOT is_meaningful_description('..') = TRUE, 'Double dot should be FALSE'; 
  ASSERT NOT is_meaningful_description('...') = TRUE, 'Triple dot should be FALSE';
  ASSERT NOT is_meaningful_description('n/a') = TRUE, 'n/a should be FALSE';
  ASSERT NOT is_meaningful_description('N/A') = TRUE, 'N/A should be FALSE';
  ASSERT NOT is_meaningful_description('   ') = TRUE, 'Whitespace should be FALSE';
  ASSERT NOT is_meaningful_description('short') = TRUE, 'Short text should be FALSE';
  ASSERT NOT is_meaningful_description(NULL) = TRUE, 'NULL should be FALSE';
  ASSERT NOT is_meaningful_description('') = TRUE, 'Empty string should be FALSE';
  
  -- Test cases that should return TRUE  
  ASSERT is_meaningful_description('This is a proper charity description with enough detail') = TRUE, 'Valid description should be TRUE';
  
  RAISE NOTICE 'All function tests passed!';
END
$$;