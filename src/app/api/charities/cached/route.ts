/**
 * API Route: Cached Organization Search  
 * Endpoint: /api/charities/cached
 * Fast local search from unified organization_cache table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const searchTerm = query.trim().toLowerCase()

    // Search in unified organization cache using PostgreSQL full-text search
    const { data: organizations, error } = await supabase
      .from('organization_cache')
      .select('external_id, name, description, category, logo_url, slug, platform')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, category.ilike.%${searchTerm}%`)
      .order('name')
      .limit(Math.min(limit, 50))

    if (error) {
      console.error('Cached organization search error:', error)
      return NextResponse.json(
        { error: 'Failed to search cached organizations' },
        { status: 500 }
      )
    }

    // Transform to match legacy JustGiving API format for backward compatibility
    const transformedResults = (organizations || []).map(org => ({
      charityId: org.platform === 'justgiving' ? parseInt(org.external_id) : org.external_id,
      name: org.name,
      description: org.description || '',
      logoAbsoluteUrl: org.logo_url,
      subCategory: org.category,
      platform: org.platform,
      slug: org.slug
    }))

    return NextResponse.json({
      success: true,
      data: {
        searchResults: transformedResults,
        total: transformedResults.length,
        source: 'cache'
      }
    })

  } catch (error) {
    console.error('Cached organization search API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search cached organizations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}