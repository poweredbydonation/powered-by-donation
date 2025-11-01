import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured') === 'true';
    
    // Parse multiple categories (comma-separated) for AND filtering
    const selectedCategories = category ? category.split(',').map(c => c.trim()).filter(Boolean) : [];
    
    console.log(`Every.org API called: categories=[${selectedCategories.join(',')}], search="${search}", time=${Date.now() - startTime}ms`);
    
    const supabase = createClient();
    
    // Get total count from platform_stats table (much faster than counting)
    const { data: statsData } = await supabase
      .from('platform_stats')
      .select('everyorg_count')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    let query = supabase
      .from('organization_cache')
      .select('*')
      .eq('platform', 'everyorg')
      .eq('is_active', true)
      .eq('show_on_platform', true);
    
    // Apply filters
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // AND filtering for multiple categories using categories_list JSONB field
    if (selectedCategories.length > 0) {
      // Use PostgreSQL @> operator for efficient JSONB containment check
      const categoryArray = JSON.stringify(selectedCategories);
      query = query.filter('categories_list', 'cs', categoryArray);
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Get total count when filters are applied
    let totalCount = 0;
    const hasFilters = search.trim() || selectedCategories.length > 0 || featured;
    
    if (!hasFilters) {
      // Use cached stats for unfiltered results
      totalCount = statsData?.everyorg_count || 0;
    } else {
      // Count filtered results
      let countQuery = supabase
        .from('organization_cache')
        .select('*', { count: 'exact', head: true })
        .eq('platform', 'everyorg')
        .eq('is_active', true)
        .eq('show_on_platform', true);
      
      if (search && search.trim()) {
        countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (selectedCategories.length > 0) {
        // Use PostgreSQL @> operator for efficient JSONB containment check
        const categoryArray = JSON.stringify(selectedCategories);
        countQuery = countQuery.filter('categories_list', 'cs', categoryArray);
      }
      
      if (featured) {
        countQuery = countQuery.eq('is_featured', true);
      }
      
      const { count } = await countQuery;
      totalCount = count || 0;
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1);
    
    console.log(`Every.org query execution starting at ${Date.now() - startTime}ms`);
    const queryStart = Date.now();
    
    const { data: organizations, error } = await query;
    
    console.log(`Every.org query completed in ${Date.now() - queryStart}ms, total time: ${Date.now() - startTime}ms`);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch nonprofits' }, { status: 500 });
    }
    
    const finalTotalCount = hasFilters ? totalCount : (statsData?.everyorg_count || 0);
    const totalPages = Math.ceil(finalTotalCount / limit);
    
    return NextResponse.json({
      organizations: organizations || [],
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: finalTotalCount,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}