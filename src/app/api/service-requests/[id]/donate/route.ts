import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { justGivingAPI } from '@/lib/justgiving/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id
    const body = await request.json()
    const { charity_id } = body
    
    if (!charity_id) {
      return NextResponse.json({ error: 'Charity ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the service request with service details
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select(`
        *,
        services (
          id,
          title,
          donation_amount
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Verify the user is the donor
    if (serviceRequest.donor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify the request is in the correct state
    if (serviceRequest.workflow_status !== 'service_request_accepted') {
      return NextResponse.json({ 
        error: 'Service request is not in the correct state for donation' 
      }, { status: 400 })
    }

    // Generate a unique reference ID for this donation
    const referenceId = `PD-${requestId.substring(0, 8).toUpperCase()}`
    
    // Create JustGiving donation URL using the staging environment
    const donationAmount = serviceRequest.services?.donation_amount || serviceRequest.donation_amount
    const donationUrl = justGivingAPI.getCharityDonationUrl(
      parseInt(charity_id), 
      donationAmount, 
      referenceId
    )

    // Update service request with donation URL and charity info
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        justgiving_charity_id: charity_id,
        donation_url: donationUrl,
        reference_id: referenceId,
        // Don't change workflow_status yet - wait for donation confirmation
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update service request' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Donation URL created successfully',
      data: {
        donationUrl,
        referenceId,
        amount: donationAmount,
        charityId: charity_id
      }
    })

  } catch (error) {
    console.error('Error creating donation URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}