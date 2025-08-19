-- Improve description quality filtering to catch placeholder and low-quality descriptions
-- This migration updates the show_on_platform logic to hide organizations with:
-- - NULL or empty descriptions
-- - Placeholder text like ".", "..", "...", "n/a", "N/A", etc.
-- - Only whitespace
-- - Very short descriptions (less than 10 characters after trimming)

-- Update the existing cron job logic to be more comprehensive
-- You can run this manually or update your cron job with this improved logic:

/*
UPDATE organization_cache 
SET show_on_platform = CASE 
  WHEN platform = 'justgiving' AND (
    description IS NULL OR 
    TRIM(description) = '' OR
    TRIM(LOWER(description)) IN ('.', '..', '...', '....', 'n/a', 'na', 'none', 'nil', 'tbc', 'tbd', 'coming soon') OR
    LENGTH(TRIM(description)) < 10 OR
    TRIM(description) ~ '^\.+$' OR  -- Only dots
    TRIM(description) ~ '^\s*$'     -- Only whitespace
  ) THEN false 
  ELSE true 
END;
*/

-- Create a function to check if a description is meaningful
CREATE OR REPLACE FUNCTION is_meaningful_description(description_text TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if description is null or empty
  IF description_text IS NULL OR TRIM(description_text) = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Return false if description is too short (less than 10 characters)
  IF LENGTH(TRIM(description_text)) < 10 THEN
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
  
  -- Return false if description is only dots
  IF TRIM(description_text) ~ '^\.+$' THEN
    RETURN FALSE;
  END IF;
  
  -- Return false if description is only whitespace characters
  IF TRIM(description_text) ~ '^\s*$' THEN
    RETURN FALSE;
  END IF;
  
  -- Return false if description is only repeated characters (like ".....")
  IF TRIM(description_text) ~ '^(.)\1+$' AND LENGTH(TRIM(description_text)) <= 10 THEN
    RETURN FALSE;
  END IF;
  
  -- If all checks pass, description is meaningful
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function
COMMENT ON FUNCTION is_meaningful_description(TEXT) 
IS 'Checks if an organization description contains meaningful content. Returns false for null, empty, placeholder, or very short descriptions.';