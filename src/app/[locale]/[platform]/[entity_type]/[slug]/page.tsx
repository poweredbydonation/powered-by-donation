/**
 * Individual Organization Page - Dynamic Route  
 * Handles: /{locale}/{platform}/{entity_type}/{slug}/
 * Examples: /en/justgiving/charities/cancer-research-uk/
 */

import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@/lib/supabase/client'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { 
  getEntityTypeFromSlug, 
  getPlatformEntityType,
  EntityType
} from '@/lib/utils/entity-urls'
import OrganizationPage from '@/components/OrganizationPage'

interface OrganizationPageProps {
  params: {
    locale: string
    platform: string
    entity_type: string
    slug: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg'].includes(platform)
}

export default async function OrganizationDetailPage({ params }: OrganizationPageProps) {
  const { locale, platform: platformStr, entity_type: entitySlug, slug } = params

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

  // Fetch organization data from unified cache
  const supabase = createClient()
  
  const { data: organization, error } = await supabase
    .from('organization_cache')
    .select('*')
    .eq('platform', platform)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !organization) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <OrganizationPage 
      locale={locale}
      platform={platform}
      entityType={entityType}
      organization={organization}
      messages={messages}
    />
  )
}

// Generate static params for popular organizations (subset for performance)
export async function generateStaticParams() {
  try {
    const supabase = createAnonClient()
    
    // Get top organizations from each platform for static generation
    const { data: organizations } = await supabase
      .from('organization_cache')
      .select('platform, slug')
      .eq('is_active', true)
      .or('is_featured.eq.true,total_donations_count.gt.10')
      .limit(100)

    if (!organizations) return []

    return organizations.map((org) => ({
      platform: org.platform,
      entity_type: getPlatformEntityType(org.platform as DonationPlatform) === 'charities' ? 'charities' : 'nonprofits',
      slug: org.slug
    }))
  } catch (error) {
    // Return empty array if database query fails during build
    console.warn('Failed to generate static params for organizations:', error)
    return []
  }
}

// Generate metadata
export async function generateMetadata({ params }: OrganizationPageProps) {
  const { locale, platform: platformStr, entity_type: entitySlug, slug } = params
  
  if (!isValidPlatform(platformStr)) {
    return {
      title: 'Organization Not Found',
    }
  }

  const platform = platformStr as DonationPlatform
  const entityType = getEntityTypeFromSlug(entitySlug)
  
  if (!entityType || getPlatformEntityType(platform) !== entityType) {
    return {
      title: 'Organization Not Found',
    }
  }

  // Fetch organization for metadata
  const supabase = createClient()
  
  const { data: organization } = await supabase
    .from('organization_cache')
    .select('name, description')
    .eq('platform', platform)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!organization) {
    return {
      title: 'Organization Not Found',
    }
  }

  const platformNames = {
    justgiving: 'JustGiving',
    everyorg: 'Every.org'
  }

  return {
    title: `${organization.name} - ${platformNames[platform]} - Powered by Donation`,
    description: organization.description || `Support ${organization.name} through skill-based donations on ${platformNames[platform]}.`,
  }
}