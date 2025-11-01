import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Fetch service request with related data
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select(`
        *,
        services!inner(
          id,
          title,
          description,
          donation_amount,
          fundraiser_id
        ),
        donor:users!donor_id(
          id,
          full_name,
          display_name
        ),
        fundraiser:users!fundraiser_id(
          id,
          full_name,
          display_name
        )
      `)
      .eq('id', requestId)
      .or(`donor_id.eq.${user.id},fundraiser_id.eq.${user.id}`)
      .single()

    if (fetchError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate time remaining for current state (if applicable)
    let timeRemaining = null
    let deadlineText = null

    const now = new Date()
    const createdAt = new Date(serviceRequest.created_at)
    const acceptedAt = serviceRequest.accepted_at ? new Date(serviceRequest.accepted_at) : null
    const feedbackDeadline = serviceRequest.feedback_deadline ? new Date(serviceRequest.feedback_deadline) : null

    switch (serviceRequest.workflow_status) {
      case 'service_requested':
        const requestDeadline = new Date(createdAt.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days from creation
        timeRemaining = Math.max(0, requestDeadline.getTime() - now.getTime())
        deadlineText = timeRemaining > 0 ? `${Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))} days remaining for response` : 'Request expired'
        break
      
      case 'service_request_accepted':
        if (acceptedAt) {
          const donationDeadline = new Date(acceptedAt.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days from acceptance
          timeRemaining = Math.max(0, donationDeadline.getTime() - now.getTime())
          deadlineText = timeRemaining > 0 ? `${Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))} days remaining for donation` : 'Donation period expired'
        }
        break
      
      case 'service_donation_received':
        if (feedbackDeadline) {
          timeRemaining = Math.max(0, feedbackDeadline.getTime() - now.getTime())
          deadlineText = timeRemaining > 0 ? `${Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))} days remaining for feedback` : 'Feedback period expired'
        }
        break
      
      default:
        deadlineText = 'No active deadline'
    }

    // Determine what actions are available for current user
    const availableActions = []
    const isDonor = serviceRequest.donor_id === user.id
    const isFundraiser = serviceRequest.fundraiser_id === user.id

    switch (serviceRequest.workflow_status) {
      case 'service_requested':
        if (isFundraiser) {
          availableActions.push('accept', 'decline')
        }
        if (isDonor) {
          availableActions.push('cancel')
        }
        break
      
      case 'service_request_accepted':
        if (isDonor) {
          availableActions.push('donate', 'cancel')
        }
        break
      
      case 'service_donation_received':
        if (isDonor && !serviceRequest.donor_service_rating) {
          availableActions.push('rate_service')
        }
        if (isFundraiser && !serviceRequest.fundraiser_donor_rating) {
          availableActions.push('rate_donor')
        }
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        ...serviceRequest,
        timeRemaining,
        deadlineText,
        availableActions,
        userRole: isDonor ? 'donor' : 'fundraiser'
      }
    })

  } catch (error) {
    console.error('Error fetching service request status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}