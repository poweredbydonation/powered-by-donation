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
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    
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
      .select('*', { count: 'exact' })
      .eq('platform', 'justgiving')
      .eq('is_active', true);
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,registration_number.ilike.%${search}%,keywords.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (country && country !== 'all') {
      if (country === 'no_country') {
        query = query.is('address_country', null);
      } else {
        query = query.eq('address_country', country);
      }
    }
    
    if (city && city !== 'all') {
      if (city === 'online') {
        // Show organizations that can receive online donations (all JustGiving charities)
        query = query.eq('is_active', true);
      } else {
        // Filter by specific city
        query = query.eq('address_city', city);
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query
      .order('is_featured', { ascending: false })
      .order('total_donations_count', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data: organizations, error, count } = await query;
    
    if (error) {
      console.error('JustGiving organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch JustGiving organizations' }, { status: 500 });
    }
    
    // If preferred filter requested, we need to check which orgs are selected by services
    let filteredOrganizations = organizations || [];
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
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      organizations: filteredOrganizations,
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: count || 0,
        has_next: page < totalPages,
        has_previous: page > 1
      },
      platform: 'justgiving'
    });
    
  } catch (error) {
    console.error('JustGiving organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}