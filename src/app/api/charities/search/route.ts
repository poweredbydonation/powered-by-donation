/**
 * API Route: Charity Search
 * Endpoint: /api/charities/search
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchAndSyncCharities } from '@/lib/justgiving/sync'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    const syncResults = searchParams.get('sync') !== 'false' // Default to true
    
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

    console.log(`Searching charities: "${query}" (max: ${maxResults}, sync: ${syncResults})`)
    
    const results = await searchAndSyncCharities(
      query.trim(),
      Math.min(maxResults, 50), // Cap at 50 results
      syncResults
    )

    return NextResponse.json({
      success: true,
      data: {
        searchResults: results.searchResults,
        syncedCount: results.syncedResults.length,
        total: results.searchResults.length
      }
    })

  } catch (error) {
    console.error('Charity search API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search charities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, maxResults = 10, sync = true } = body
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
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

    console.log(`Searching charities via POST: "${query}" (max: ${maxResults}, sync: ${sync})`)
    
    const results = await searchAndSyncCharities(
      query.trim(),
      Math.min(maxResults, 50), // Cap at 50 results
      sync
    )

    return NextResponse.json({
      success: true,
      data: {
        searchResults: results.searchResults,
        syncedResults: results.syncedResults,
        syncedCount: results.syncedResults.length,
        total: results.searchResults.length
      }
    })

  } catch (error) {
    console.error('Charity search API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search charities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}