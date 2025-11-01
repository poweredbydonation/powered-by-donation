import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// API endpoint to immediately confirm donation on success page redirect
export async function POST(request: NextRequest) {
  try {
    const { jgDonationId } = await request.json()

    if (!jgDonationId) {
      return NextResponse.json(
        { error: 'JustGiving donation ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for database writes
    const supabase = createClient()

    console.log(`🔄 Confirming donation with JustGiving ID: ${jgDonationId}`)

    // Find the pending service request by external_donation_id
    // Note: The cron job may have already set this, so we check for it too
    const { data: existingRequest, error: findError } = await supabase
      .from('service_requests')
      .select('id, reference_id, status, external_donation_id')
      .eq('external_donation_id', jgDonationId)
      .eq('status', 'success')
      .single()

    if (!findError && existingRequest) {
      console.log(`✅ Donation ${jgDonationId} already confirmed by cron job`)
      return NextResponse.json({
        success: true,
        message: 'Donation already confirmed',
        reference_id: existingRequest.reference_id,
        already_confirmed: true
      })
    }

    // Find pending donation that doesn't have external_donation_id set yet
    // We'll need to match by timing or store reference in session/cookie
    const { data: pendingRequests, error: queryError } = await supabase
      .from('service_requests')
      .select('id, reference_id, status, created_at')
      .eq('status', 'pending')
      .is('external_donation_id', null)
      .order('created_at', { ascending: false })
      .limit(5) // Get recent pending donations

    if (queryError) {
      console.error('Error querying pending donations:', queryError)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('No pending donations found to confirm')
      return NextResponse.json(
        { error: 'No matching pending donation found' },
        { status: 404 }
      )
    }

    // For now, take the most recent pending donation
    // TODO: Improve matching by storing reference in session/URL
    const donationToUpdate = pendingRequests[0]

    // Update the donation to success status with JustGiving ID
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'success',
        external_donation_id: jgDonationId
      })
      .eq('id', donationToUpdate.id)

    if (updateError) {
      console.error('Error updating donation status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update donation status' },
        { status: 500 }
      )
    }

    console.log(`✅ Donation ${donationToUpdate.reference_id} confirmed immediately`)

    return NextResponse.json({
      success: true,
      message: 'Donation confirmed successfully',
      reference_id: donationToUpdate.reference_id,
      status: 'success'
    })

  } catch (error) {
    console.error('Error in donation confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}