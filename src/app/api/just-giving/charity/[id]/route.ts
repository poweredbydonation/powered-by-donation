/**
 * Platform-Specific API Route: JustGiving Charity Service Requests
 * Endpoint: /api/just-giving/charity/[id]
 * 
 * Creates service_requests records with platform-specific reference generation
 * and donation URL generation for JustGiving charities
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { justGivingAPI } from '@/lib/justgiving/client'
import type { DonationPlatform } from '@/types/database'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string // JustGiving charity ID
  }
}

interface ServiceRequestBody {
  serviceId: string
  donorId: string
  fundraiserId: string
  donationAmount: number
  locale?: string
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const charityId = parseInt(params.id)
    
    if (isNaN(charityId) || charityId <= 0) {
      return NextResponse.json(
        { error: 'Invalid JustGiving charity ID' },
        { status: 400 }
      )
    }

    const body: ServiceRequestBody = await request.json()
    const { serviceId, donorId, fundraiserId, donationAmount, locale = 'en' } = body
    
    // Validate required fields
    if (!serviceId || !donorId || !fundraiserId || !donationAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, donorId, fundraiserId, donationAmount' },
        { status: 400 }
      )
    }

    if (donationAmount <= 0) {
      return NextResponse.json(
        { error: 'Donation amount must be greater than 0' },
        { status: 400 }
      )
    }

    console.log(`Creating JustGiving service request for charity ${charityId}`)

    const supabase = createClient()
    
    // Generate platform-specific reference ID
    const { data: referenceResult, error: referenceError } = await supabase
      .rpc('generate_platform_reference', { 
        platform_type: 'justgiving' as DonationPlatform 
      })

    if (referenceError || !referenceResult) {
      console.error('Failed to generate reference ID:', referenceError)
      return NextResponse.json(
        { error: 'Failed to generate donation reference' },
        { status: 500 }
      )
    }

    const referenceId = referenceResult as string
    console.log(`Generated reference ID: ${referenceId}`)

    // Get charity data from cache
    const { data: charityData, error: charityError } = await supabase
      .from('justgiving_charity_cache')
      .select('name, justgiving_charity_id')
      .eq('justgiving_charity_id', charityId.toString())
      .single()

    if (charityError || !charityData) {
      console.error('Charity not found in cache:', charityError)
      return NextResponse.json(
        { error: 'Charity not found. Please ensure charity is valid.' },
        { status: 404 }
      )
    }

    // Generate donation URL with reference
    const donationUrl = justGivingAPI.getCharityDonationUrl(
      charityId,
      donationAmount,
      referenceId
    )

    // Set timeout to 30 minutes from now
    const timeoutAt = new Date()
    timeoutAt.setMinutes(timeoutAt.getMinutes() + 30)

    // Create service request record
    const { data: serviceRequest, error: insertError } = await supabase
      .from('service_requests')
      .insert({
        donor_id: donorId,
        fundraiser_id: fundraiserId,
        service_id: serviceId,
        platform: 'justgiving' as DonationPlatform,
        reference_id: referenceId,
        organization_id: charityId.toString(),
        organization_name: charityData.name,
        donation_url: donationUrl,
        donation_amount: donationAmount,
        timeout_at: timeoutAt.toISOString(),
        status: 'pending',
        // Legacy fields for backward compatibility
        justgiving_charity_id: charityId.toString(),
        charity_name: charityData.name
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create service request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create service request' },
        { status: 500 }
      )
    }

    console.log(`✅ Created JustGiving service request with reference: ${referenceId}`)

    return NextResponse.json({
      success: true,
      data: {
        serviceRequestId: serviceRequest.id,
        referenceId,
        donationUrl,
        charityId,
        charityName: charityData.name,
        donationAmount,
        platform: 'justgiving',
        timeoutAt: timeoutAt.toISOString(),
        status: 'pending'
      }
    })

  } catch (error) {
    console.error(`JustGiving service request API error for charity ${params.id}:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to create JustGiving service request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}