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
    featured?: string
    preferred?: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg'].includes(platform)
}

export default async function OrganizationBrowsePage({ 
  params,
  searchParams 
}: OrganizationBrowsePageProps) {
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
}

// Generate static params for all possible combinations
export function generateStaticParams() {
  const platforms: DonationPlatform[] = ['justgiving', 'everyorg']
  const params: Array<{ platform: string; entity_type: string }> = []

  platforms.forEach((platform) => {
    const entityType = getPlatformEntityType(platform)
    const slugs = getAllEntitySlugs(entityType)
    
    slugs.forEach((slug) => {
      params.push({
        platform,
        entity_type: slug
      })
    })
  })

  return params
}

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
    everyorg: 'Every.org'
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