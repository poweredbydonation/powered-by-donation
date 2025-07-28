/**
 * API Route: Single Charity Operations
 * Endpoint: /api/charities/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrSyncCharity, validateAndSyncCharity } from '@/lib/justgiving/sync'
import { justGivingAPI } from '@/lib/justgiving/client'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const charityId = parseInt(params.id)
    
    if (isNaN(charityId) || charityId <= 0) {
      return NextResponse.json(
        { error: 'Invalid charity ID' },
        { status: 400 }
      )
    }

    console.log(`Fetching charity data for ID: ${charityId}`)
    
    const charityData = await getOrSyncCharity(charityId)
    
    if (!charityData) {
      return NextResponse.json(
        { error: 'Charity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: charityData
    })

  } catch (error) {
    console.error(`Charity fetch API error for ID ${params.id}:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch charity data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const charityId = parseInt(params.id)
    
    if (isNaN(charityId) || charityId <= 0) {
      return NextResponse.json(
        { error: 'Invalid charity ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body
    
    if (action === 'validate') {
      console.log(`Validating charity ID: ${charityId}`)
      
      const isValid = await validateAndSyncCharity(charityId)
      
      return NextResponse.json({
        success: true,
        data: {
          charityId,
          isValid,
          message: isValid ? 'Charity is valid and synced' : 'Charity validation failed'
        }
      })
    }
    
    if (action === 'sync') {
      console.log(`Force syncing charity ID: ${charityId}`)
      
      const charityData = await getOrSyncCharity(charityId)
      
      return NextResponse.json({
        success: true,
        data: charityData,
        message: 'Charity data synced successfully'
      })
    }
    
    if (action === 'donation-url') {
      const { amount, reference } = body
      
      const donationUrl = justGivingAPI.getCharityDonationUrl(
        charityId,
        amount ? parseInt(amount) : undefined,
        reference
      )
      
      return NextResponse.json({
        success: true,
        data: {
          charityId,
          donationUrl,
          amount: amount ? parseInt(amount) : null,
          reference: reference || null
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: validate, sync, donation-url' },
      { status: 400 }
    )

  } catch (error) {
    console.error(`Charity action API error for ID ${params.id}:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to process charity action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}