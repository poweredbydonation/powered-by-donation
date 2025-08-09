/**
 * Platform-Specific API Route: Every.org Nonprofit Service Requests  
 * Endpoint: /api/every-org/non-profit/[id]
 * 
 * Phase 1: Returns "Coming Soon" response
 * Phase 2: Will create service_requests records with Every.org integration
 */

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string // Every.org nonprofit EIN
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const nonprofitEin = params.id
    
    // Validate EIN format (basic validation)
    if (!nonprofitEin || nonprofitEin.length < 9) {
      return NextResponse.json(
        { error: 'Invalid Every.org nonprofit EIN' },
        { status: 400 }
      )
    }

    console.log(`Every.org service request attempted for nonprofit ${nonprofitEin}`)

    // Phase 1: Coming Soon Response
    return NextResponse.json({
      success: false,
      error: 'Every.org integration coming soon',
      data: {
        platform: 'every_org',
        nonprofitEin,
        message: 'Every.org donations will be available in a future update. Please use JustGiving for now.',
        availablePlatforms: ['justgiving'],
        estimatedAvailability: 'Q2 2024'
      }
    }, { status: 501 }) // 501 Not Implemented

    /*
    // Phase 2: Full Implementation (to be uncommented later)
    
    const body = await request.json()
    const { serviceId, donorId, fundraiserId, donationAmount, locale = 'en' } = body
    
    // Validate required fields
    if (!serviceId || !donorId || !fundraiserId || !donationAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, donorId, fundraiserId, donationAmount' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Generate platform-specific reference ID  
    const { data: referenceResult, error: referenceError } = await supabase
      .rpc('generate_platform_reference', { 
        platform_type: 'every_org' as DonationPlatform 
      })

    if (referenceError || !referenceResult) {
      console.error('Failed to generate reference ID:', referenceError)
      return NextResponse.json(
        { error: 'Failed to generate donation reference' },
        { status: 500 }
      )
    }

    const referenceId = referenceResult as string
    
    // Get nonprofit data from cache
    const { data: nonprofitData, error: nonprofitError } = await supabase
      .from('every_org_nonprofit_cache')
      .select('name, nonprofit_ein')
      .eq('nonprofit_ein', nonprofitEin)
      .single()

    // Create service request record
    const { data: serviceRequest, error: insertError } = await supabase
      .from('service_requests')
      .insert({
        donor_id: donorId,
        fundraiser_id: fundraiserId,
        service_id: serviceId,
        platform: 'every_org' as DonationPlatform,
        reference_id: referenceId,
        organization_id: nonprofitEin,
        organization_name: nonprofitData.name,
        donation_amount: donationAmount,
        status: 'pending'
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      data: {
        serviceRequestId: serviceRequest.id,
        referenceId,
        nonprofitEin,
        nonprofitName: nonprofitData.name,
        donationAmount,
        platform: 'every_org',
        status: 'pending'
      }
    })
    */

  } catch (error) {
    console.error(`Every.org service request API error for nonprofit ${params.id}:`, error)
    return NextResponse.json(
      { 
        error: 'Every.org integration not available',
        details: 'Please use JustGiving for donations at this time'
      },
      { status: 501 }
    )
  }
}