/**
 * Organization Browse Page - Dynamic Route
 * Handles: /{locale}/{platform}/{entity_type}/
 * Examples: /en/justgiving/charities/, /tr/everyorg/kar-amaci-gutmeyen-kuruluslar/
 */

import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { DonationPlatform } from '@/types/database'
import { 
  getEntityTypeFromSlug, 
  getPlatformEntityType,
  getAllEntitySlugs,
  EntityType
} from '@/lib/utils/entity-urls'
import OrganizationBrowse from '@/components/OrganizationBrowse'

interface OrganizationBrowsePageProps {
  params: {
    locale: string
    platform: string
    entity_type: string
  }
  searchParams: {
    page?: string
    search?: string
    category?: string
    city?: string
    country?: string
    featured?: string
    preferred?: string
    purpose?: string
    beneficiary?: string
    state?: string
    operating_country?: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg', 'acnc'].includes(platform)
}

export default async function OrganizationBrowsePage({ 
  params,
  searchParams 
}: OrganizationBrowsePageProps) {
  try {
    const { locale, platform: platformStr, entity_type: entitySlug } = params

    // Validate platform
    if (!isValidPlatform(platformStr)) {
      notFound()
    }

    const platform = platformStr as DonationPlatform

    // Get entity type from URL slug
    const entityType = getEntityTypeFromSlug(entitySlug)
    if (!entityType) {
      notFound()
    }

    // Validate platform-entity consistency
    const expectedEntityType = getPlatformEntityType(platform)
    if (entityType !== expectedEntityType) {
      notFound()
    }

    const messages = await getMessages({ locale })

    return (
      <OrganizationBrowse
        locale={locale}
        platform={platform}
        entityType={entityType}
        messages={messages}
        searchParams={searchParams}
      />
    )
  } catch (error) {
    console.error('OrganizationBrowsePage error:', error)
    // Return a fallback error page instead of throwing
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">We're having trouble loading this page. Please try again later.</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    )
  }
}

// This page is dynamic due to searchParams usage
export const dynamic = 'force-dynamic'

// Generate metadata
export async function generateMetadata({ params }: OrganizationBrowsePageProps) {
  const { locale, platform: platformStr, entity_type: entitySlug } = params
  
  if (!isValidPlatform(platformStr)) {
    return {
      title: 'Organizations Not Found',
    }
  }

  const platform = platformStr as DonationPlatform
  const entityType = getEntityTypeFromSlug(entitySlug)
  
  if (!entityType) {
    return {
      title: 'Organizations Not Found',
    }
  }

  const platformNames = {
    justgiving: 'JustGiving',
    everyorg: 'Every.org',
    acnc: 'ACNC'
  }

  const entityNames = {
    charities: 'Charities',
    nonprofits: 'Nonprofits'
  }

  return {
    title: `Browse ${platformNames[platform]} ${entityNames[entityType]} - Powered by Donation`,
    description: `Discover ${platformNames[platform]} ${entityNames[entityType].toLowerCase()} and support causes through skill-based donations.`,
  }
}