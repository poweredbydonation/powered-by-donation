import Link from 'next/link'
import { Service, ServiceLocation } from '@/types/database'
import { formatCurrency } from '@/lib/currency'

interface ServiceCardProps {
  service: Service & {
    provider: {
      name: string
      show_bio: boolean
    }
  }
}

export default function ServiceCard({ service }: ServiceCardProps) {
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

  // Charity requirement display
  const charityRequirement = service.charity_requirement_type === 'any_charity' 
    ? 'Any registered charity'
    : 'Specific charities'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div className="p-6">
        {/* Service Title */}
        <div className="mb-4">
          <Link 
            href={`/services/${serviceSlug}`}
            className="text-xl font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
          >
            {service.title}
          </Link>
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
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Donation Required
            </div>
            <div className="text-lg font-bold text-green-600">
              {donationAmount}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Location
            </div>
            <div className="text-sm text-gray-900 font-medium">
              {locationDisplay}
            </div>
          </div>
        </div>

        {/* Provider and Charity Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="text-sm">
              <span className="text-gray-500">by </span>
              <span className="font-medium text-gray-900">
                {service.provider.name}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {charityRequirement}
          </div>
        </div>

        {/* Availability Status */}
        <div className="mt-3">
          {service.max_supporters && service.current_supporters !== undefined ? (
            <div className="text-xs text-gray-500">
              {service.current_supporters} / {service.max_supporters} supporters
              {service.current_supporters >= service.max_supporters && (
                <span className="ml-2 text-red-600 font-medium">Full</span>
              )}
            </div>
          ) : (
            <div className="text-xs text-green-600 font-medium">
              Available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}