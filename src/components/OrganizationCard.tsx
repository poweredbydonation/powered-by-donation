/**
 * Organization Card Component
 * Displays individual organization in browse grid
 */

import Link from 'next/link'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { EntityType, buildPlatformUrl } from '@/lib/utils/entity-urls'
import { ExternalLink, MapPin, Star, Mail, Globe } from 'lucide-react'

interface OrganizationCardProps {
  organization: OrganizationCache
  locale: string
  platform: DonationPlatform
  entityType: EntityType
  onCategorySelect?: (category: string) => void
}

export default function OrganizationCard({
  organization,
  locale,
  platform,
  entityType,
  onCategorySelect
}: OrganizationCardProps) {
  const orgUrl = buildPlatformUrl(locale, platform, organization.slug)

  // Handle tag clicks for category filtering
  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (onCategorySelect) {
      onCategorySelect(tag)
    } else {
      // Fallback for when onCategorySelect is not provided
      const url = new URL(window.location.href)
      url.searchParams.set('category', tag)
      url.searchParams.delete('page')
      window.location.href = url.toString()
    }
  }

  const platformConfig = {
    justgiving: {
      color: 'blue',
      badgeClass: 'bg-blue-100 text-blue-800',
      categoryBadgeClass: 'bg-blue-100 text-blue-800',
      purposeBadgeClass: 'bg-blue-100 text-blue-800',
      linkClass: 'text-blue-600 hover:text-blue-800',
      cardClass: 'bg-gradient-to-br from-blue-50 via-white to-white border-l-4 border-l-blue-500 shadow-sm hover:shadow-lg'
    },
    everyorg: {
      color: 'green', 
      badgeClass: 'bg-green-100 text-green-800',
      categoryBadgeClass: 'bg-green-100 text-green-800',
      purposeBadgeClass: 'bg-green-100 text-green-800',
      linkClass: 'text-green-600 hover:text-green-800',
      cardClass: 'bg-gradient-to-br from-green-50 via-white to-white border-l-4 border-l-green-500 shadow-sm hover:shadow-lg'
    },
    acnc: {
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800',
      categoryBadgeClass: 'bg-amber-100 text-amber-800',
      purposeBadgeClass: 'bg-orange-100 text-orange-800',
      linkClass: 'text-orange-600 hover:text-orange-800',
      cardClass: 'bg-gradient-to-br from-amber-50 via-white to-white border-l-4 border-l-amber-500 shadow-sm hover:shadow-lg'
    }
  }

  const config = platformConfig[platform]

  return (
    <div className={`${config.cardClass} border rounded-lg p-6 transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`flex items-start ${platform === 'everyorg' ? 'space-x-4' : 'space-x-0'}`}>
        {/* Organization Logo - Only show for Every.org */}
        {platform === 'everyorg' && organization.logo_url ? (
          <img
            src={organization.logo_absolute_url || organization.logo_url}
            alt={organization.name}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : platform === 'everyorg' ? (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs font-medium">
              {organization.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : null}

        <div className={`flex-1 min-w-0 ${platform !== 'everyorg' ? 'ml-0' : ''}`}>
          {/* Organization Name */}
          <h3 className="font-semibold text-gray-900 mb-1">
            <Link href={orgUrl} className={`${config.linkClass} hover:underline`}>
              {organization.display_name || organization.name}
            </Link>
          </h3>

          {/* Category & Location */}
          <div className="flex items-center space-x-2 mb-2">
            {organization.category && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platform === 'acnc' ? config.categoryBadgeClass : config.badgeClass}`}>
                {organization.category}
              </span>
            )}
            {organization.is_featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>

          {/* ACNC Charitable Purposes */}
          {platform === 'acnc' && organization.acnc_purposes && typeof organization.acnc_purposes === 'object' && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {Object.entries(organization.acnc_purposes)
                  .filter(([_, value]) => value === true || value === 'true')
                  .slice(0, 3)
                  .map(([purpose, _], index) => (
                    <span
                      key={index}
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.purposeBadgeClass}`}
                      title={`Charitable purpose: ${purpose.replace(/_/g, ' ')}`}
                    >
                      {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                {Object.entries(organization.acnc_purposes || {})
                  .filter(([_, value]) => value === true || value === 'true').length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{Object.entries(organization.acnc_purposes || {})
                      .filter(([_, value]) => value === true || value === 'true').length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ACNC Beneficiaries */}
          {platform === 'acnc' && organization.acnc_beneficiaries && typeof organization.acnc_beneficiaries === 'object' && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {Object.entries(organization.acnc_beneficiaries)
                  .filter(([_, value]) => value === true || value === 'true')
                  .slice(0, 2)
                  .map(([beneficiary, _], index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      title={`Beneficiaries: ${beneficiary.replace(/_/g, ' ')}`}
                    >
                      {beneficiary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                {Object.entries(organization.acnc_beneficiaries || {})
                  .filter(([_, value]) => value === true || value === 'true').length > 2 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{Object.entries(organization.acnc_beneficiaries || {})
                      .filter(([_, value]) => value === true || value === 'true').length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {platform === 'justgiving' ? (
            /* JustGiving detailed address */
            <div className="space-y-1 mb-2">
              {(organization.address_line1 || organization.address_city || organization.address_county || organization.address_country || organization.address_postcode) && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    {organization.address_line1 && (
                      <div>{organization.address_line1}</div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {organization.address_city && (
                        <span>{organization.address_city}</span>
                      )}
                      {organization.address_city && organization.address_county && (
                        <span>,</span>
                      )}
                      {organization.address_county && (
                        <span>{organization.address_county}</span>
                      )}
                      {(organization.address_city || organization.address_county) && organization.address_postcode && (
                        <span>{organization.address_postcode}</span>
                      )}
                    </div>
                    {organization.address_country && (
                      <div className="font-medium">{organization.address_country}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Other platforms simple location */
            organization.address_city && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {organization.address_city}
                {organization.address_country && organization.address_country !== organization.address_city && (
                  <span>, {organization.address_country}</span>
                )}
              </div>
            )
          )}

          {/* Contact Information - JustGiving only */}
          {platform === 'justgiving' && (organization.email_address || organization.website_url) && (
            <div className="space-y-1 mb-2">
              {organization.email_address && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                  <a 
                    href={`mailto:${organization.email_address}`}
                    className="hover:text-blue-600 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {organization.email_address}
                  </a>
                </div>
              )}
              {organization.website_url && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                  <a 
                    href={organization.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {organization.website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {organization.description && (
            <p className="text-sm text-gray-600 mb-3">
              {organization.description}
            </p>
          )}

          {/* Tags for Every.org */}
          {platform === 'everyorg' && organization.categories_list && Array.isArray(organization.categories_list) && organization.categories_list.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {organization.categories_list.slice(0, 5).map((tag: string, index: number) => (
                  <span
                    key={index}
                    onClick={(e) => handleTagClick(tag, e)}
                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded cursor-pointer hover:bg-green-200 transition-colors"
                    title={`Click to browse ${tag} category`}
                  >
                    {tag}
                  </span>
                ))}
                {organization.categories_list.length > 5 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{organization.categories_list.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

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
            {(organization.profile_page_url || (platform === 'acnc' && organization.acnc_abn)) && (
              <a
                href={
                  organization.profile_page_url || 
                  (platform === 'acnc' && organization.acnc_abn 
                    ? `https://www.acnc.gov.au/charity/charities?search=${organization.acnc_abn}` 
                    : '')
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`${config.linkClass} hover:underline`}
                onClick={(e) => e.stopPropagation()}
                title={platform === 'acnc' ? 'Search on ACNC Register' : 'View profile'}
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