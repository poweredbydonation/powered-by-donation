/**
 * API Route: ACNC Organizations
 * Endpoint: /api/acnc/organizations
 * Platform-specific organization fetching from unified organization_cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12'); // Smaller initial load for better performance
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    const purpose = searchParams.get('purpose') || '';
    const beneficiary = searchParams.get('beneficiary') || '';
    
    // Parse multiple values (comma-separated) and trim whitespace
    const categories = category ? category.split(',').map(s => s.trim()).filter(Boolean) : [];
    // For cities, don't split by comma as addresses may contain commas - treat as single value
    const cities = city ? [city.trim()].filter(Boolean) : [];
    const states = state ? state.split(',').map(s => s.trim()).filter(Boolean) : [];
    const purposes = purpose ? purpose.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: 'Missing required environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient();
    
    let query = supabase
      .from('organization_cache')
      .select('*') // Remove count entirely for maximum performance
      .eq('platform', 'acnc')
      .eq('is_active', true)
      .eq('show_on_platform', true); // Add quality filter early
    
    
    // Apply basic filters only when requested (not on initial load)
    if (search && search.trim()) {
      // Simplify search to most commonly used fields first
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (categories.length > 0) {
      query = query.in('category', categories);
    }
    
    // Only apply location filters when specifically requested
    if (cities.length > 0 && !cities.includes('all')) {
      if (cities.includes('online')) {
        // Online is default behavior, no additional filtering needed
      } else {
        query = query.in('address_city', cities);
      }
    }
    
    // Only apply state filtering when specifically requested  
    if (states.length > 0 && !states.includes('all')) {
      const stateConditions = states.map(state => {
        switch (state) {
          case 'ACT': return 'acnc_operates_in_act.eq.Y';
          case 'NSW': return 'acnc_operates_in_nsw.eq.Y';
          case 'NT': return 'acnc_operates_in_nt.eq.Y';
          case 'QLD': return 'acnc_operates_in_qld.eq.Y';
          case 'SA': return 'acnc_operates_in_sa.eq.Y';
          case 'TAS': return 'acnc_operates_in_tas.eq.Y';
          case 'VIC': return 'acnc_operates_in_vic.eq.Y';
          case 'WA': return 'acnc_operates_in_wa.eq.Y';
          default: return null;
        }
      }).filter(Boolean);
      
      if (stateConditions.length > 0) {
        query = query.or(stateConditions.join(','));
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Skip complex JSONB filtering on initial load - only apply when filters are actually used
    if (purposes.length > 0) {
      // Filter by specific purposes in JSONB object
      const purposeConditions = purposes.map(p => `acnc_purposes.cs.{"${p}": true}`);
      query = query.or(purposeConditions.join(','));
    }

    if (beneficiary && beneficiary.trim()) {
      // Filter by specific beneficiary key in JSONB object
      query = query.filter('acnc_beneficiaries', 'cs', `{"${beneficiary}": true}`);
    }

    // Get total count - use cached stats only when no filters are applied
    let totalCount = 0;
    const hasFilters = search.trim() || categories.length > 0 || cities.length > 0 || states.length > 0 || featured || preferred || purposes.length > 0 || beneficiary.trim();
    
    if (!hasFilters) {
      // Use cached stats for unfiltered results (much faster)
      const { data: statsData } = await supabase
        .from('platform_stats')
        .select('acnc_count')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();
      
      totalCount = statsData?.acnc_count || 0;
    } else {
      // Count filtered results when filters are applied
      let countQuery = supabase
        .from('organization_cache')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'acnc')
        .eq('is_active', true)
        .eq('show_on_platform', true);
      
      // Apply same filters as main query
      if (search && search.trim()) {
        countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (categories.length > 0) {
        countQuery = countQuery.in('category', categories);
      }
      
      if (cities.length > 0 && !cities.includes('all')) {
        if (!cities.includes('online')) {
          countQuery = countQuery.in('address_city', cities);
        }
      }
      
      if (states.length > 0 && !states.includes('all')) {
        const stateConditions = states.map(state => {
          switch (state) {
            case 'ACT': return 'acnc_operates_in_act.eq.Y';
            case 'NSW': return 'acnc_operates_in_nsw.eq.Y';
            case 'NT': return 'acnc_operates_in_nt.eq.Y';
            case 'QLD': return 'acnc_operates_in_qld.eq.Y';
            case 'SA': return 'acnc_operates_in_sa.eq.Y';
            case 'TAS': return 'acnc_operates_in_tas.eq.Y';
            case 'VIC': return 'acnc_operates_in_vic.eq.Y';
            case 'WA': return 'acnc_operates_in_wa.eq.Y';
            default: return null;
          }
        }).filter(Boolean);
        
        if (stateConditions.length > 0) {
          countQuery = countQuery.or(stateConditions.join(','));
        }
      }
      
      if (featured) {
        countQuery = countQuery.eq('is_featured', true);
      }
      
      if (purposes.length > 0) {
        // Filter by specific purposes in JSONB object
        const purposeConditions = purposes.map(p => `acnc_purposes.cs.{"${p}": true}`);
        countQuery = countQuery.or(purposeConditions.join(','));
      }

      if (beneficiary && beneficiary.trim()) {
        // Filter by specific beneficiary key in JSONB object
        countQuery = countQuery.filter('acnc_beneficiaries', 'cs', `{"${beneficiary}": true}`);
      }
      
      const { count } = await countQuery;
      totalCount = count || 0;
    }
    
    // Apply pagination without sorting for maximum performance
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1); // No sorting - use natural database order
    
    console.log(`ACNC query built in ${Date.now() - startTime}ms`);
    const queryStart = Date.now();
    
    const { data: organizations, error } = await query;
    
    console.log(`ACNC query executed in ${Date.now() - queryStart}ms`);
    
    if (error) {
      console.error('ACNC organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch ACNC organizations' }, { status: 500 });
    }
    
    // Most filtering is now done at database level, minimal post-processing needed
    let filteredOrganizations = organizations || [];
    
    
    // If preferred filter requested, we need to check which orgs are selected by services
    if (preferred) {
      const { data: services } = await supabase
        .from('services')
        .select('platform_requirements')
        .not('platform_requirements', 'is', null);
      
      const preferredOrgIds = new Set();
      services?.forEach(service => {
        if (service.platform_requirements?.platform_rules?.acnc?.specific_organizations) {
          service.platform_requirements.platform_rules.acnc.specific_organizations.forEach((orgId: string) => 
            preferredOrgIds.add(orgId)
          );
        }
      });
      
      filteredOrganizations = filteredOrganizations.filter(org => 
        preferredOrgIds.has(org.id)
      );
    }
    
    // Handle pagination after any remaining post-query filtering
    let finalOrganizations = filteredOrganizations;
    
    if (preferred) {
      // For preferred filtering, apply pagination manually since it's post-query
      const offset = (page - 1) * limit;
      finalOrganizations = filteredOrganizations.slice(offset, offset + limit);
    }
    
    // Return response with total count for pagination
    return NextResponse.json({
      organizations: finalOrganizations,
      pagination: {
        page,
        page_size: limit,
        total_results: totalCount || 0,
        has_next: finalOrganizations.length === limit, // Assume more if we got full page
        has_previous: page > 1
      },
      platform: 'acnc'
    });
    
  } catch (error) {
    console.error('ACNC organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}