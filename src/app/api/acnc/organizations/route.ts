/**
 * API Route: ACNC Organizations
 * Endpoint: /api/acnc/organizations
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
    const state = searchParams.get('state') || '';
    const featured = searchParams.get('featured') === 'true';
    const preferred = searchParams.get('preferred') === 'true';
    const purpose = searchParams.get('purpose') || '';
    
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
      .eq('platform', 'acnc')
      .eq('is_active', true);
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,acnc_abn.ilike.%${search}%,acnc_charity_legal_name.ilike.%${search}%,acnc_other_organisation_names.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (city && city !== 'all') {
      if (city === 'online') {
        // Show organizations that can receive online donations (browse-only for ACNC)
        query = query.eq('is_active', true);
      } else {
        // Filter by specific city using ACNC address data
        query = query.eq('address_city', city);
      }
    }
    
    if (state && state !== 'all') {
      // Filter by state using ACNC operates_in fields
      switch (state) {
        case 'ACT':
          query = query.eq('acnc_operates_in_act', 'Y');
          break;
        case 'NSW':
          query = query.eq('acnc_operates_in_nsw', 'Y');
          break;
        case 'NT':
          query = query.eq('acnc_operates_in_nt', 'Y');
          break;
        case 'QLD':
          query = query.eq('acnc_operates_in_qld', 'Y');
          break;
        case 'SA':
          query = query.eq('acnc_operates_in_sa', 'Y');
          break;
        case 'TAS':
          query = query.eq('acnc_operates_in_tas', 'Y');
          break;
        case 'VIC':
          query = query.eq('acnc_operates_in_vic', 'Y');
          break;
        case 'WA':
          query = query.eq('acnc_operates_in_wa', 'Y');
          break;
      }
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    if (purpose) {
      // Filter by ACNC purpose using JSONB contains
      query = query.contains('acnc_purposes', { [purpose]: true });
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
      console.error('ACNC organizations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch ACNC organizations' }, { status: 500 });
    }
    
    // If preferred filter requested, we need to check which orgs are selected by services
    let filteredOrganizations = organizations || [];
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