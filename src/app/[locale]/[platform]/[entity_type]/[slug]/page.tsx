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
  return ['justgiving', 'everyorg', 'acnc'].includes(platform)
}

export default async function OrganizationDetailPage({ params }: OrganizationPageProps) {
  try {
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
  } catch (error) {
    console.error('OrganizationDetailPage error:', error)
    // Return a fallback error page instead of throwing
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h1>
          <p className="text-gray-600 mb-4">We couldn't find the organization you're looking for.</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    )
  }
}

// Force dynamic rendering to avoid static generation conflicts
export const dynamic = 'force-dynamic'

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
    everyorg: 'Every.org',
    acnc: 'ACNC'
  }

  return {
    title: `${organization.name} - ${platformNames[platform]} - Powered by Donation`,
    description: organization.description || `Support ${organization.name} through skill-based donations on ${platformNames[platform]}.`,
  }
}