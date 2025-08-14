-- Fix search_path security warnings for FTS functions
-- Addresses Supabase security linter warnings about mutable search_path

-- Fix update_organization_cache_fts function
ALTER FUNCTION public.update_organization_cache_fts() SET search_path = public;

-- Fix update_charity_fts function  
ALTER FUNCTION public.update_charity_fts() SET search_path = public;

-- Add comments for security documentation
COMMENT ON FUNCTION public.update_organization_cache_fts() IS 'Update full-text search vector for organization cache - search_path set for security';
COMMENT ON FUNCTION public.update_charity_fts() IS 'Update full-text search vector for charity cache - search_path set for security';