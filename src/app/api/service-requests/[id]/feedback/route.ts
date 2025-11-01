import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type ServiceRating = 'Great' | 'Could be better' | 'Service not delivered'
type DonorRating = 'Great' | 'Could be better' | 'No response'

interface FeedbackRequest {
  serviceRating?: ServiceRating
  donorRating?: DonorRating
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const requestId = params.id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: FeedbackRequest = await request.json()
    const { serviceRating, donorRating } = body

    // Verify the service request exists and user is involved
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .eq('workflow_status', 'service_donation_received')
      .or(`donor_id.eq.${user.id},fundraiser_id.eq.${user.id}`)
      .single()

    if (fetchError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found or not in feedback state' },
        { status: 404 }
      )
    }

    // Validate that user is providing appropriate rating type
    const isDonor = serviceRequest.donor_id === user.id
    const isFundraiser = serviceRequest.fundraiser_id === user.id

    if (isDonor && !serviceRating) {
      return NextResponse.json(
        { error: 'Donors must provide service rating' },
        { status: 400 }
      )
    }

    if (isFundraiser && !donorRating) {
      return NextResponse.json(
        { error: 'Fundraisers must provide donor rating' },
        { status: 400 }
      )
    }

    // Log the parameters being sent to the RPC function
    console.log('Calling submit_workflow_feedback with:', {
      request_id: requestId,
      user_id: user.id,
      service_rating: serviceRating || null,
      donor_rating: donorRating || null,
      isDonor,
      isFundraiser
    })

    // Use the workflow feedback function
    const { error: feedbackError } = await supabase.rpc(
      'submit_workflow_feedback',
      {
        request_id: requestId,
        user_id: user.id,
        service_rating: serviceRating || null,
        donor_rating: donorRating || null
      }
    )

    if (feedbackError) {
      console.error('RPC function error:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to submit feedback', details: feedbackError.message },
        { status: 500 }
      )
    }

    // Fetch updated request
    const { data: updatedRequest, error: refetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (refetchError || !updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to fetch updated request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: updatedRequest
    })

  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}