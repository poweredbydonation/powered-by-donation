import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient()
    const userId = params.userId

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user can access this data (only their own requests)
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role') // 'donor' or 'fundraiser'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - start with basic query to debug 500 error
    let query = supabase
      .from('service_requests')
      .select('*')

    // Filter by role (donor or fundraiser)
    if (role === 'donor') {
      query = query.eq('donor_id', userId)
    } else if (role === 'fundraiser') {
      query = query.eq('fundraiser_id', userId)
    } else {
      // If no role specified, get both
      query = query.or(`donor_id.eq.${userId},fundraiser_id.eq.${userId}`)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('workflow_status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: serviceRequests, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch service requests', details: fetchError.message },
        { status: 500 }
      )
    }

    // Simplified response for debugging - just return basic requests
    const enrichedRequests = serviceRequests.map(request => ({
      ...request,
      userRole: request.donor_id === userId ? 'donor' : 'fundraiser'
    }))

    return NextResponse.json({
      success: true,
      data: enrichedRequests,
      pagination: {
        offset,
        limit,
        total: enrichedRequests.length
      }
    })

  } catch (error) {
    console.error('Error fetching user service requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}