/**
 * Individual Entity Page - Dynamic Route  
 * Handles: /{locale}/{platform}/{entity_type}/{slug}/
 * Examples: /en/justgiving/charities/cancer-research-uk/, /en/PoweredByDonation/services/web-development/
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
import { Suspense } from 'react'

interface EntityPageProps {
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

function isValidPlatformSlug(platform: string): boolean {
  return ['justgiving', 'everyorg', 'acnc', 'poweredbydonation'].includes(platform.toLowerCase())
}

function normalizePlatformSlug(platform: string): string {
  const lower = platform.toLowerCase()
  if (lower === 'poweredbydonation') {
    return 'PoweredByDonation'
  }
  return platform
}

// Dynamic import for Service component
const ServicePage = () => import('../../../../../components/ServicePageContent').then(m => m.default)

export default async function EntityDetailPage({ params }: EntityPageProps) {
  try {
    const { locale, platform: platformStr, entity_type: entitySlug, slug } = params

    // Validate platform slug
    if (!isValidPlatformSlug(platformStr)) {
      notFound()
    }

    // Normalize platform slug
    const normalizedPlatform = normalizePlatformSlug(platformStr)

    // Get entity type from URL slug
    const entityType = getEntityTypeFromSlug(entitySlug)
    if (!entityType) {
      notFound()
    }

    // Handle PoweredByDonation services
    if (normalizedPlatform === 'PoweredByDonation') {
      if (entityType !== 'services') {
        notFound()
      }

      const messages = await getMessages({ locale })
      
      // Import the service page content dynamically
      const ServicePageContent = await ServicePage()
      
      return (
        <Suspense fallback={<div>Loading service...</div>}>
          <ServicePageContent 
            params={{ locale, slug }}
          />
        </Suspense>
      )
    }

    // Handle donation platforms
    if (!isValidPlatform(normalizedPlatform)) {
      notFound()
    }

    const platform = normalizedPlatform as DonationPlatform

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
          <a href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
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
export async function generateMetadata({ params }: EntityPageProps) {
  const { locale, platform: platformStr, entity_type: entitySlug, slug } = params
  
  if (!isValidPlatformSlug(platformStr)) {
    return {
      title: 'Page Not Found',
    }
  }

  // Normalize platform slug
  const normalizedPlatform = normalizePlatformSlug(platformStr)

  const entityType = getEntityTypeFromSlug(entitySlug)
  if (!entityType) {
    return {
      title: 'Page Not Found',
    }
  }

  // Handle PoweredByDonation services
  if (normalizedPlatform === 'PoweredByDonation') {
    if (entityType !== 'services') {
      return {
        title: 'Service Not Found',
      }
    }

    // Fetch service for metadata
    const supabase = createAnonClient()
    const { data: services } = await supabase
      .from('services')
      .select('title, description')
      .eq('is_active', true)
      .eq('show_in_directory', true)

    // Find service by slug
    const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const service = services?.find(s => generateSlug(s.title) === slug)

    if (!service) {
      return {
        title: 'Service Not Found - Powered by Donation',
      }
    }

    return {
      title: `${service.title} - Services - Powered by Donation`,
      description: service.description || `Professional service: ${service.title}. Support charities through skill-based donations.`,
    }
  }

  // Handle donation platforms
  if (!isValidPlatform(normalizedPlatform)) {
    return {
      title: 'Organization Not Found',
    }
  }

  const platform = normalizedPlatform as DonationPlatform
  
  if (getPlatformEntityType(platform) !== entityType) {
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