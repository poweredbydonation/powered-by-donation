import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service_id, donation_amount, platform } = body

    if (!service_id || !donation_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if service exists and is active
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, user_id, is_active, show_in_directory')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (!service.is_active || !service.show_in_directory) {
      return NextResponse.json({ error: 'Service is not available' }, { status: 400 })
    }

    // Check if user is trying to request their own service
    if (service.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot request your own service' }, { status: 400 })
    }

    // Check if there's already an active request for this service from this user
    const { data: existingRequest } = await supabase
      .from('service_requests')
      .select('id, workflow_status')
      .eq('service_id', service_id)
      .eq('donor_id', user.id)
      .not('workflow_status', 'in', '("service_request_timeout","service_donation_timeout","service_feedback_timeout","service_feedback_recorded")')
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have an active request for this service' 
      }, { status: 409 })
    }

    // Create the service request
    const { data: newRequest, error: createError } = await supabase
      .from('service_requests')
      .insert({
        service_id,
        donor_id: user.id,
        fundraiser_id: service.user_id,
        donation_amount,
        platform,
        workflow_status: 'service_requested',
        justgiving_charity_id: 'TBD', // Placeholder - charity will be selected later in workflow
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating service request:', createError)
      return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service request created successfully',
      data: newRequest
    })

  } catch (error) {
    console.error('Service request creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}