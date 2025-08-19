/**
 * API Route: ACNC Organizations
 * Endpoint: /api/acnc/organizations
 * Platform-specific organization fetching from unified organization_cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { containsOperatingCountry } from '@/lib/utils/country-codes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    
    // Parse multiple values (comma-separated)
    const categories = category ? category.split(',').filter(Boolean) : [];
    const cities = city ? city.split(',').filter(Boolean) : [];
    const states = state ? state.split(',').filter(Boolean) : [];
    const purposes = purpose ? purpose.split(',').filter(Boolean) : [];
    const operatingCountry = searchParams.get('operating_country') || '';
    
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
      .select('*', { count: 'estimated' }) // Use estimated count for much better performance
      .eq('platform', 'acnc')
      .eq('is_active', true);
    
    // When filtering by operating country, only get organizations with operating countries data
    if (operatingCountry) {
      query = query
        .not('acnc_operating_countries', 'is', null)
        .neq('acnc_operating_countries', '');
    }
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,acnc_abn.ilike.%${search}%,acnc_charity_legal_name.ilike.%${search}%,acnc_other_organisation_names.ilike.%${search}%`);
    }
    
    if (categories.length > 0) {
      query = query.in('category', categories);
    }
    
    if (cities.length > 0 && !cities.includes('all')) {
      if (cities.includes('online')) {
        // Show organizations that can receive online donations (browse-only for ACNC)
        query = query.eq('is_active', true);
      } else {
        // Filter by specific cities using ACNC address data
        query = query.in('address_city', cities);
      }
    }
    
    if (states.length > 0 && !states.includes('all')) {
      // Filter by multiple states using ACNC operates_in fields
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
    
    if (purposes.length > 0) {
      // Filter by multiple ACNC purposes using JSONB contains (OR condition)
      const purposeConditions = purposes.map(p => 
        `acnc_purposes.cs.${JSON.stringify({ [p]: true })}`
      );
      if (purposeConditions.length > 0) {
        query = query.or(purposeConditions.join(','));
      }
    }

    if (beneficiary) {
      // Filter by ACNC beneficiary using JSONB contains
      query = query.contains('acnc_beneficiaries', { [beneficiary]: true });
    }

    // Apply pagination for all queries (operating country now uses database filtering)
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
    
    // Most filtering is now done at database level, minimal post-processing needed
    let filteredOrganizations = organizations || [];
    
    // Operating country filtering is now handled at database level via the operatingCountry filter above
    
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
    let actualCount = count || 0;
    
    if (preferred) {
      // For preferred filtering, apply pagination manually since it's post-query
      actualCount = filteredOrganizations.length;
      const offset = (page - 1) * limit;
      finalOrganizations = filteredOrganizations.slice(offset, offset + limit);
    }
    
    const totalPages = Math.ceil(actualCount / limit);
    
    return NextResponse.json({
      organizations: finalOrganizations,
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: actualCount,
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