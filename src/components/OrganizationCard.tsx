/**
 * Organization Card Component
 * Displays individual organization in browse grid
 */

import Link from 'next/link'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { EntityType, buildPlatformUrl } from '@/lib/utils/entity-urls'
import { ExternalLink, MapPin, Star } from 'lucide-react'

interface OrganizationCardProps {
  organization: OrganizationCache
  locale: string
  platform: DonationPlatform
  entityType: EntityType
}

export default function OrganizationCard({
  organization,
  locale,
  platform,
  entityType
}: OrganizationCardProps) {
  const orgUrl = buildPlatformUrl(locale, platform, organization.slug)

  const platformConfig = {
    justgiving: {
      color: 'blue',
      badgeClass: 'bg-blue-100 text-blue-800',
      linkClass: 'text-blue-600 hover:text-blue-800'
    },
    everyorg: {
      color: 'green', 
      badgeClass: 'bg-green-100 text-green-800',
      linkClass: 'text-green-600 hover:text-green-800'
    }
  }

  const config = platformConfig[platform]

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Organization Logo */}
        {organization.logo_url ? (
          <img
            src={organization.logo_absolute_url || organization.logo_url}
            alt={organization.name}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs font-medium">
              {organization.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Organization Name */}
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            <Link href={orgUrl} className={`${config.linkClass} hover:underline`}>
              {organization.display_name || organization.name}
            </Link>
          </h3>

          {/* Category & Location */}
          <div className="flex items-center space-x-2 mb-2">
            {organization.category && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {organization.category}
              </span>
            )}
            {organization.is_featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>

          {/* Location */}
          {organization.address_city && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {organization.address_city}
              {organization.address_country && organization.address_country !== organization.address_city && (
                <span>, {organization.address_country}</span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {organization.description || 'No description available.'}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex space-x-3">
              {(organization.total_donations_count || 0) > 0 && (
                <span>{organization.total_donations_count} donations</span>
              )}
              {(organization.this_month_count || 0) > 0 && (
                <span>{organization.this_month_count} this month</span>
              )}
            </div>
            
            {/* External Link */}
            {organization.profile_page_url && (
              <a
                href={organization.profile_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${config.linkClass} hover:underline`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}