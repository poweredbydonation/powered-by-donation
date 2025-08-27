import Link from 'next/link'
import { Service, ServiceLocation, DonationPlatform, ServiceRequest, ServiceWorkflowStatus } from '@/types/database'
import { formatCurrency } from '@/lib/currency'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'
import { WorkflowStatusBadge, WorkflowActionButtons } from '@/components/workflow'

interface ServiceCardProps {
  service: Service & {
    user: {
      name: string
      bio?: string
      location?: string
    } | null
  }
  locale?: string
  platform?: DonationPlatform
  isPersonalView?: boolean
  // Workflow-specific props (optional)
  serviceRequest?: ServiceRequest & {
    services?: {
      title: string
      donation_amount: number
    }
    donor?: {
      display_name?: string
      full_name?: string
    }
    fundraiser?: {
      display_name?: string
      full_name?: string
    }
  }
  currentUserId?: string
  onWorkflowUpdate?: (updatedRequest: ServiceRequest) => void
  showWorkflowState?: boolean
  showManageButton?: boolean
}

export default function ServiceCard({ 
  service, 
  locale = 'en', 
  platform,
  isPersonalView = false,
  serviceRequest,
  currentUserId,
  onWorkflowUpdate,
  showWorkflowState = false,
  showManageButton = false
}: ServiceCardProps) {  
  // Safety check - if no user data, don't render the card
  if (!service.user) {
    return null
  }

  // Determine user role in workflow context
  const getUserRole = () => {
    if (!serviceRequest || !currentUserId) return null
    if (serviceRequest.donor_id === currentUserId) return 'donor'
    if (serviceRequest.fundraiser_id === currentUserId) return 'fundraiser'
    return null
  }

  const userRole = getUserRole()

  // Generate appropriate service URLs based on context
  const generateServiceUrl = (subPath?: string) => {
    if (isPersonalView) {
      // Personal services: /en/my/services/slug
      const servicesSlug = locale === 'tr' ? 'hizmetler' : 'services'
      const fullPath = subPath ? `/${servicesSlug}${subPath}` : `/${servicesSlug}`
      return `/${locale}/my${fullPath}`
    } else {
      // Platform services: /en/PoweredByDonation/services/slug  
      return getLocalizedServicesUrl(locale, subPath)
    }
  }

  // Parse service locations from JSONB
  const locations = Array.isArray(service.service_locations) 
    ? service.service_locations as ServiceLocation[]
    : []
  
  // Get primary location type
  const primaryLocation = locations[0]
  const locationDisplay = primaryLocation 
    ? primaryLocation.type === 'remote' 
      ? 'Remote'
      : primaryLocation.type === 'hybrid'
      ? 'Hybrid'
      : primaryLocation.area || 'Physical'
    : 'Location TBD'

  // Format donation amount
  const donationAmount = formatCurrency(service.donation_amount)

  // Generate service slug from title
  const serviceSlug = service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Charity requirement display from platform requirements
  const getCharityRequirement = () => {
    if (!service.platform_requirements) {
      // Fallback to legacy field if platform_requirements is not available
      return service.charity_requirement_type === 'any_charity' 
        ? 'Any registered charity'
        : 'Specific charities'
    }

    const platformReqs = service.platform_requirements
    const hasSpecificOrgs = Object.values(platformReqs.platform_rules).some(
      (rule: any) => rule && rule.organizations === 'specific_organizations' && rule.specific_organizations && rule.specific_organizations.length > 0
    )

    if (hasSpecificOrgs) {
      // Count total specific organizations across all platforms
      const totalOrgs = Object.values(platformReqs.platform_rules).reduce(
        (count: number, rule: any) => {
          if (rule && rule.organizations === 'specific_organizations' && rule.specific_organizations) {
            return count + rule.specific_organizations.length
          }
          return count
        }, 0
      )

      if (totalOrgs === 1) {
        // Try to get organization name from organization_name field (backward compatibility)
        return service.organization_name || 'Specific organization'
      } else if (totalOrgs > 1) {
        // Get breakdown of organizations by platform
        const platformBreakdown = Object.keys(platformReqs.platform_rules).map(platform => {
          const rule = platformReqs.platform_rules[platform as keyof typeof platformReqs.platform_rules]
          if (rule && rule.organizations === 'specific_organizations' && rule.specific_organizations && rule.specific_organizations.length > 0) {
            const count = rule.specific_organizations.length
            const platformName = platform === 'justgiving' ? 'JustGiving' : 
                                platform === 'everyorg' ? 'Every.org' : 
                                platform === 'acnc' ? 'ACNC' : platform
            
            return `${count} organization${count > 1 ? 's' : ''} on ${platformName}`
          }
          return null
        }).filter(Boolean)
        
        return `Supporting ${platformBreakdown.join(' and ')}`
      }
    }

    // Any organization from selected platforms
    const platformNames = platformReqs.allowed_platforms
      .map((p: string) => p === 'justgiving' ? 'JustGiving' : p === 'everyorg' ? 'Every.org' : 'ACNC')
      .join(', ')
    
    return `Any ${platformNames} organization`
  }

  const charityRequirement = getCharityRequirement()

  // Platform configuration for styling and labels
  const platformConfig = {
    justgiving: {
      name: 'JustGiving',
      gradient: 'from-purple-50 via-white to-white',
      border: 'border-purple-200 border-l-purple-500',
      hoverBorder: 'hover:border-purple-300',
      textHover: 'hover:text-purple-600',
      statusColor: 'text-purple-600',
      buttonBg: 'bg-[#7A04DD] hover:bg-[#540099]',
      buttonText: 'Donate on JustGiving & Get This'
    },
    everyorg: {
      name: 'Every.org',
      gradient: 'from-green-50 via-white to-white',
      border: 'border-green-200 border-l-green-500',
      hoverBorder: 'hover:border-green-300',
      textHover: 'hover:text-green-600',
      statusColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Donate on Every.org & Get This'
    },
    acnc: {
      name: 'ACNC',
      gradient: 'from-orange-50 via-white to-white',
      border: 'border-orange-200 border-l-orange-500',
      hoverBorder: 'hover:border-orange-300',
      textHover: 'hover:text-orange-600',
      statusColor: 'text-orange-600',
      buttonBg: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Support via ACNC & Get This'
    }
  }

  // Use platform-specific config or default to JustGiving for backwards compatibility
  const config = platform ? platformConfig[platform] : platformConfig.justgiving

  // Fundraiser name with fallback
  const fundraiserName = service.user?.name || 'Unknown Fundraiser'

  return (
    <div className={`bg-gradient-to-br ${config.gradient} border ${config.border} border-l-4 rounded-lg shadow-sm hover:shadow-lg ${config.hoverBorder} transition-all duration-200 flex flex-col`}>
      <div className="p-6 flex-1 flex flex-col">
        {/* Service Title */}
        <div className="mb-4">
          <a 
            href={generateServiceUrl(`/${serviceSlug}`)}
            className={`text-xl font-semibold text-gray-900 ${config.textHover} line-clamp-2`}
          >
            {service.title}
          </a>
        </div>

        {/* Service Description */}
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {service.description}
          </p>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Donation Amount */}
          <div>
            <div className="text-xs text-purple-600 uppercase tracking-wide font-medium mb-1">
              Donation Required
            </div>
            <div className="text-lg font-bold text-purple-600">
              {donationAmount}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className={`text-xs ${config.statusColor} uppercase tracking-wide font-medium mb-1`}>
              Location
            </div>
            <div className="text-sm text-gray-900 font-medium">
              {locationDisplay}
            </div>
          </div>
        </div>

        {/* Fundraiser and Charity Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
          <div className="flex items-center">
            <div className="text-sm">
              <span className="text-gray-500">by </span>
              <span className="font-medium text-gray-900">
                {fundraiserName}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {charityRequirement}
          </div>
        </div>

        {/* Availability Status */}
        <div className="mb-4 flex-1">
          {service.max_donors && service.current_donors !== undefined ? (
            <div className="text-xs text-gray-500">
              {service.current_donors} / {service.max_donors} donors
              {service.current_donors >= service.max_donors && (
                <span className="ml-2 text-red-600 font-medium">Full</span>
              )}
            </div>
          ) : (
            <div className={`text-xs ${config.statusColor} font-medium`}>
              Available
            </div>
          )}
        </div>

        {/* Workflow Status and Actions */}
        {showWorkflowState && serviceRequest && serviceRequest.workflow_status && (
          <div className="mt-4 space-y-3">
            <WorkflowStatusBadge 
              status={serviceRequest.workflow_status} 
              className="w-fit"
            />
            
            {userRole && onWorkflowUpdate && (
              <WorkflowActionButtons
                request={serviceRequest}
                userRole={userRole}
                onStateChange={onWorkflowUpdate}
              />
            )}
          </div>
        )}

        {/* Platform-Specific Donate Button or Manage Button - Always at bottom */}
        {!showWorkflowState && (
          <div className="mt-auto">
            {showManageButton ? (
              <a
                href={generateServiceUrl(`/${serviceSlug}`)}
                className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-full"
              >
                Manage
              </a>
            ) : (
              <a
                href={generateServiceUrl(`/${serviceSlug}`)}
                className={`inline-flex items-center justify-center w-full px-4 py-3 ${config.buttonBg} text-white rounded-lg font-medium transition-colors`}
              >
                {config.buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}