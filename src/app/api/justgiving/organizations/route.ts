/**
 * API Route: JustGiving Organizations
 * Endpoint: /api/justgiving/organizations
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
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    
    // const cacheKey = orgCache.generateKey({ platform: 'justgiving', page, limit, filters });
    
    // Check cache first (only for non-user-specific queries)
    // Temporarily disabled to test fresh queries
    // if (!preferred) {
    //   const cachedResult = orgCache.get(cacheKey);
    //   if (cachedResult) {
    //     return NextResponse.json(cachedResult);
    //   }
    // }
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: 'Missing required environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient();
    
    // Decode URL parameters properly
    const decodedCity = city ? decodeURIComponent(city.replace(/\+/g, ' ')) : '';
    
    // Use pre-calculated count from platform_stats for base count (massive performance boost)
    let totalCount = 0;
    
    // If no filters are applied, use the fast pre-calculated count
    if (!search && !category && !decodedCity && !featured && !preferred) {
      const { data: statsData } = await supabase
        .from('platform_stats')
        .select('justgiving_count')
        .order('last_updated', { ascending: false })
        .limit(1);
      
      totalCount = statsData?.[0]?.justgiving_count || 0;
    } else {
      // Only run expensive count query when filters are applied
      let countQuery = supabase
        .from('organization_cache')
        .select('*', { count: 'exact' })
        .eq('platform', 'justgiving')
        .eq('is_active', true)
        .eq('show_on_platform', true);
      
      // Apply the same filters to count query
      if (search) {
        countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,registration_number.ilike.%${search}%,keywords.ilike.%${search}%`);
      }
      
      if (category) {
        countQuery = countQuery.eq('category', category);
      }
      
      if (decodedCity && decodedCity !== 'all') {
        if (decodedCity === 'online') {
          // No additional filter needed for online - already filtered by is_active
        } else {
          // Filter by specific city
          countQuery = countQuery.eq('address_city', decodedCity);
        }
      }
      
      if (featured) {
        countQuery = countQuery.eq('is_featured', true);
      }
      
      // Execute count query only when needed
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('JustGiving count query error:', countError);
        return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
      }
      
      totalCount = count || 0;
    }

    let query = supabase
      .from('organization_cache')
      .select('id, name, display_name, description, slug, external_id, category, is_featured, address_city, address_country, profile_page_url, total_donations_count, this_month_count')
      .eq('platform', 'justgiving')
      .eq('is_active', true)
      .eq('show_on_platform', true);
    
    // Apply the same filters to main query
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,registration_number.ilike.%${search}%,keywords.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (decodedCity && decodedCity !== 'all') {
      if (decodedCity === 'online') {
        // No additional filter needed for online - already filtered by is_active
      } else {
        // Filter by specific city
        query = query.eq('address_city', decodedCity);
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Apply pagination to the main query
    const offset = (page - 1) * limit;
    query = query
      .order('id') // Add simple sorting for consistent pagination
      .range(offset, offset + limit - 1);
    
    // Execute main query
    const { data: organizations, error } = await query;
    
    
    if (error) {
      console.error('JustGiving organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch JustGiving organizations' }, { status: 500 });
    }
    
    // If preferred filter requested, we need to check which orgs are selected by services
    let filteredOrganizations = organizations || [];
    let finalCount = totalCount;
    
    if (preferred) {
      const { data: services } = await supabase
        .from('services')
        .select('preferred_charities')
        .not('preferred_charities', 'is', null);
      
      const preferredCharityIds = new Set();
      services?.forEach(service => {
        if (service.preferred_charities && Array.isArray(service.preferred_charities)) {
          service.preferred_charities.forEach(charityId => preferredCharityIds.add(charityId));
        }
      });
      
      filteredOrganizations = filteredOrganizations.filter(org => 
        preferredCharityIds.has(parseInt(org.external_id))
      );
      
      // For preferred filter, adjust count based on filtered results
      if (filteredOrganizations.length < limit) {
        // If we got fewer results than the page size, we're probably near the end
        finalCount = (page - 1) * limit + filteredOrganizations.length;
      }
    }
    
    const totalPages = Math.ceil(finalCount / limit);
    
    const response = {
      organizations: filteredOrganizations,
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: finalCount,
        has_next: page < totalPages,
        has_previous: page > 1
      },
      platform: 'justgiving'
    };
    
    // Cache result (only for non-user-specific queries)
    // Temporarily disabled caching
    // if (!preferred && !search) {
    //   // Cache static data (no search/personalization) for longer
    //   orgCache.set(cacheKey, response, true);
    // } else if (!preferred) {
    //   // Cache dynamic data (search results) for shorter time
    //   orgCache.set(cacheKey, response, false);
    // }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('JustGiving organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}