import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Verify the service request exists and user is the fundraiser
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .eq('fundraiser_id', user.id)
      .eq('workflow_status', 'service_requested')
      .single()

    if (fetchError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found or unauthorized' },
        { status: 404 }
      )
    }

    // For decline, we set to timeout status (effectively the same outcome)
    const { error: transitionError } = await supabase.rpc(
      'transition_workflow_state',
      {
        request_id: requestId,
        new_status: 'service_request_timeout',
        user_id: user.id
      }
    )

    if (transitionError) {
      return NextResponse.json(
        { error: 'Failed to decline request', details: transitionError.message },
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
      message: 'Service request declined',
      data: updatedRequest
    })

  } catch (error) {
    console.error('Error declining service request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}