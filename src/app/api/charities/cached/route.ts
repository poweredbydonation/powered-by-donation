/**
 * API Route: Cached Charity Search
 * Endpoint: /api/charities/cached
 * Fast local search from charity_cache table
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

    // Search in cached charities using PostgreSQL full-text search
    const { data: charities, error } = await supabase
      .from('charity_cache')
      .select('justgiving_charity_id, name, description, category, logo_url, slug')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, category.ilike.%${searchTerm}%`)
      .order('name')
      .limit(Math.min(limit, 50))

    if (error) {
      console.error('Cached charity search error:', error)
      return NextResponse.json(
        { error: 'Failed to search cached charities' },
        { status: 500 }
      )
    }

    // Transform to match JustGiving API format
    const transformedResults = (charities || []).map(charity => ({
      charityId: parseInt(charity.justgiving_charity_id),
      name: charity.name,
      description: charity.description || '',
      logoAbsoluteUrl: charity.logo_url,
      subCategory: charity.category
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
    console.error('Cached charity search API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search cached charities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}