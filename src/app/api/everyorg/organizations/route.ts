/**
 * API Route: Every.org Organizations
 * Endpoint: /api/everyorg/organizations  
 * Platform-specific organization fetching from unified organization_cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    
    const supabase = createClient();
    
    // Build count query with same filters as main query
    let countQuery = supabase
      .from('organization_cache')
      .select('*', { count: 'exact' })
      .eq('platform', 'everyorg')
      .eq('is_active', true);
    
    // Apply the same filters to count query
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,external_id.ilike.%${search}%`);
    }
    
    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    let query = supabase
      .from('organization_cache')
      .select('*')
      .eq('platform', 'everyorg')
      .eq('is_active', true);
    
    // Apply the same filters to main query
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,external_id.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // Note: Every.org organizations don't have structured address data
    // Location information is embedded in description field
    // State/city filtering removed as address_county and address_city are null
    
    if (city && city !== 'all') {
      if (city === 'online') {
        // Show organizations that can receive online donations (all Every.org nonprofits)
        // No additional filter needed - already filtered by is_active
      } else {
        // Filter by description content for location terms
        query = query.ilike('description', `%${city}%`);
        countQuery = countQuery.ilike('description', `%${city}%`);
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
      countQuery = countQuery.eq('is_featured', true);
    }
    
    // Get filtered count first
    const { data: countData, error: countError, count: totalCount } = await countQuery;
    
    if (countError) {
      console.error('Every.org count query error:', countError);
      return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
    }
    
    // Apply pagination without sorting for maximum performance
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1); // No sorting - use natural database order
    
    const { data: organizations, error } = await query;
    
    if (error) {
      console.error('Every.org organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch Every.org organizations' }, { status: 500 });
    }
    
    // If preferred filter requested, we need to check which orgs are selected by services
    let filteredOrganizations = organizations || [];
    let finalCount = totalCount || 0;
    
    if (preferred) {
      const { data: services } = await supabase
        .from('services')
        .select('platform_requirements')
        .not('platform_requirements', 'is', null);
      
      const preferredOrgIds = new Set();
      services?.forEach(service => {
        if (service.platform_requirements?.platform_rules?.everyorg?.specific_organizations) {
          service.platform_requirements.platform_rules.everyorg.specific_organizations.forEach((orgId: string) => 
            preferredOrgIds.add(orgId)
          );
        }
      });
      
      filteredOrganizations = filteredOrganizations.filter(org => 
        preferredOrgIds.has(org.id)
      );
      
      // For preferred filter, we need to count how many of the filtered orgs are preferred
      // This is a limitation - we can't easily count preferred orgs without fetching all
      // For now, we'll use the length of filtered results as a rough estimate
      // In a production system, you'd want to optimize this with a materialized view or better query structure
      if (filteredOrganizations.length < limit) {
        // If we got fewer results than the page size, we're probably near the end
        finalCount = (page - 1) * limit + filteredOrganizations.length;
      }
      // Note: This is an approximation and may not be perfectly accurate for preferred filter
    }
    
    const totalPages = Math.ceil(finalCount / limit);
    
    return NextResponse.json({
      organizations: filteredOrganizations,
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: finalCount,
        has_next: page < totalPages,
        has_previous: page > 1
      },
      platform: 'everyorg'
    });
    
  } catch (error) {
    console.error('Every.org organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}