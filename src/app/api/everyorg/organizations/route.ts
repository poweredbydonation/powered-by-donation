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
    const featured = searchParams.get('featured') === 'true';
    
    const supabase = createClient();
    
    // Get total count from platform_stats table (much faster than counting)
    const { data: statsData } = await supabase
      .from('platform_stats')
      .select('everyorg_count')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    const totalCount = statsData?.everyorg_count || 0;

    let query = supabase
      .from('organization_cache')
      .select('*')
      .eq('platform', 'everyorg')
      .eq('is_active', true);
    
    // Apply pagination first (no filters for now to avoid timeout)
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1);
    
    const { data: organizations, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch nonprofits' }, { status: 500 });
    }
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      organizations: organizations || [],
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: totalCount,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}