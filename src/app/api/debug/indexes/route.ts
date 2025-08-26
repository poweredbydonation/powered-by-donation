import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Query to check indexes on organization_cache table
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          indexname, 
          tablename,
          indexdef 
        FROM pg_indexes 
        WHERE tablename = 'organization_cache' 
          AND (indexname LIKE '%everyorg%' OR indexname LIKE '%categories%')
        ORDER BY indexname;
      `
    });
    
    if (error) {
      console.error('Error querying indexes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ indexes: data });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}