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
    const featured = searchParams.get('featured') === 'true';
    
    const supabase = createClient();
    
    let query = supabase
      .from('every_org_nonprofit_cache')
      .select('*', { count: 'exact' })
      .eq('is_active', true);
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,nonprofit_ein.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (featured) {
      query = query.eq('is_featured', true);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data: nonprofits, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch nonprofits' }, { status: 500 });
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      nonprofits: nonprofits || [],
      pagination: {
        page,
        pages: totalPages,
        page_size: limit,
        total_results: count || 0,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}