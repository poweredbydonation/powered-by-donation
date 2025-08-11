import { NextRequest, NextResponse } from 'next/server';
import { everyOrgClient } from '@/lib/everyorg/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const take = parseInt(searchParams.get('take') || '20');
    const causes = searchParams.get('causes')?.split(',') || [];
    
    if (!query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    // Use the Every.org client to search in real-time
    const nonprofits = await everyOrgClient.searchNonprofits(query, {
      take: Math.min(take, 50), // Max 50 per Every.org API
      causes: causes.filter(Boolean)
    });
    
    return NextResponse.json({
      nonprofits,
      query,
      total_results: nonprofits.length
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}