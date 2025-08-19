import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This API route uses request.url and must be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const platform = searchParams.get('platform')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Query services that have the organization ID in their platform_requirements
    // We need to use a JSON path query to check if the organization ID exists in the specific platform's specific_organizations array
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        user:users!inner(
          name,
          bio,
          location
        )
      `)
      .eq('is_active', true)
      .eq('show_in_directory', true)
      .not('platform_requirements', 'is', null)
      .or(`platform_requirements->>type.eq.specific_platforms`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    // Filter services that support this organization either specifically or through "any organization" rules
    const filteredServices = services?.filter(service => {
      if (!service.platform_requirements) return false

      const platformReqs = service.platform_requirements
      const platformRule = platformReqs.platform_rules?.[platform]

      if (!platformRule) return false

      // Check if service specifically targets this organization
      const hasSpecificOrganization = (
        platformRule.organizations === 'specific_organizations' &&
        platformRule.specific_organizations &&
        platformRule.specific_organizations.includes(organizationId)
      )

      // Check if service supports any organization on this platform
      const supportsAnyOrganization = (
        platformReqs.allowed_platforms.includes(platform) &&
        (
          // Either no specific organizations specified (supports all)
          platformRule.organizations !== 'specific_organizations' ||
          // Or has select_all_organizations flag set to true
          platformRule.select_all_organizations === true ||
          // Or specific_organizations array is empty (supports all)
          !platformRule.specific_organizations ||
          platformRule.specific_organizations.length === 0
        ) &&
        // Make sure this organization is not excluded
        (!platformRule.excluded_organizations || 
         !platformRule.excluded_organizations.includes(organizationId))
      )

      return hasSpecificOrganization || supportsAnyOrganization
    }) || []

    return NextResponse.json({
      services: filteredServices,
      count: filteredServices.length
    })

  } catch (error) {
    console.error('Error in services by organization API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}