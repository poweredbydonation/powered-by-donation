import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { ein: string } }
) {
  try {
    const { ein } = params;
    
    if (!ein) {
      return NextResponse.json({ error: 'EIN parameter is required' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    const { data: nonprofit, error } = await supabase
      .from('every_org_nonprofit_cache')
      .select('*')
      .eq('nonprofit_ein', ein)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch nonprofit' }, { status: 500 });
    }
    
    if (!nonprofit) {
      return NextResponse.json({ error: 'Nonprofit not found' }, { status: 404 });
    }
    
    return NextResponse.json({ nonprofit });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}