/**
 * API Route: Populate Charity Cache
 * Endpoint: /api/charities/populate
 * Manually trigger charity cache population
 */

import { NextRequest, NextResponse } from 'next/server'
import { populateCharityCache, populateEssentialCharities } from '@/lib/justgiving/populate'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode = 'essential' } = body // 'full' or 'essential'
    
    console.log(`Starting charity cache population in ${mode} mode...`)
    
    let results
    if (mode === 'full') {
      results = await populateCharityCache()
    } else {
      results = await populateEssentialCharities()
    }
    
    return NextResponse.json({
      success: true,
      message: `Charity cache populated successfully in ${mode} mode`,
      data: results
    })

  } catch (error) {
    console.error('Charity population API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to populate charity cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'essential'
    
    console.log(`Starting charity cache population in ${mode} mode via GET...`)
    
    let results
    if (mode === 'full') {
      results = await populateCharityCache()
    } else {
      results = await populateEssentialCharities()
    }
    
    return NextResponse.json({
      success: true,
      message: `Charity cache populated successfully in ${mode} mode`,
      data: results
    })

  } catch (error) {
    console.error('Charity population API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to populate charity cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}