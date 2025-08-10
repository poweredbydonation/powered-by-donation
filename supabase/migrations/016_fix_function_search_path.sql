-- Fix search_path for database functions to resolve security warnings
-- This addresses Supabase security linter warnings about mutable search_path

-- Fix calculate_fundraiser_happiness function
ALTER FUNCTION public.calculate_fundraiser_happiness(uuid) SET search_path = public;

-- Fix calculate_donor_happiness function  
ALTER FUNCTION public.calculate_donor_happiness(uuid) SET search_path = public;

-- Fix calculate_service_happiness function
ALTER FUNCTION public.calculate_service_happiness(uuid) SET search_path = public;

-- Fix trigger_update_happiness_metrics function
ALTER FUNCTION public.trigger_update_happiness_metrics() SET search_path = public;

-- Fix increment_charity_stats function
ALTER FUNCTION public.increment_charity_stats(text, numeric, text) SET search_path = public;

-- Fix reset_monthly_charity_stats function
ALTER FUNCTION public.reset_monthly_charity_stats() SET search_path = public;

-- Add comments for documentation
COMMENT ON FUNCTION public.calculate_fundraiser_happiness(uuid) IS 'Calculate happiness metrics for fundraiser - search_path set for security';
COMMENT ON FUNCTION public.calculate_donor_happiness(uuid) IS 'Calculate happiness metrics for donor - search_path set for security';
COMMENT ON FUNCTION public.calculate_service_happiness(uuid) IS 'Calculate happiness metrics for service - search_path set for security';
COMMENT ON FUNCTION public.trigger_update_happiness_metrics() IS 'Trigger function to update happiness metrics - search_path set for security';
COMMENT ON FUNCTION public.increment_charity_stats(text, numeric, text) IS 'Increment charity donation statistics - search_path set for security';
COMMENT ON FUNCTION public.reset_monthly_charity_stats() IS 'Reset monthly charity statistics - search_path set for security';