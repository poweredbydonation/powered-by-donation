/**
 * Entity Browse Page - Dynamic Route
 * Handles: /{locale}/{platform}/{entity_type}/
 * Examples: /en/justgiving/charities/, /tr/everyorg/kar-amaci-gutmeyen-kuruluslar/, /en/PoweredByDonation/services/
 */

import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { DonationPlatform } from '@/types/database'
import { 
  getEntityTypeFromSlug, 
  getPlatformEntityType,
  PERSONAL_PLATFORM_SLUGS,
  isPersonalPlatform,
  PERSONAL_ENTITY_TYPES,
  isSystemPlatform,
  SYSTEM_ENTITY_TYPES,
  SYSTEM_PLATFORM_SLUGS
} from '@/lib/utils/entity-urls'
import OrganizationBrowse from '@/components/OrganizationBrowse'
import { Suspense } from 'react'

interface EntityBrowsePageProps {
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
    jgDonationId?: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg', 'acnc'].includes(platform)
}

function isValidPlatformSlug(platform: string): boolean {
  const normalizedPlatforms = ['justgiving', 'everyorg', 'acnc', 'poweredbydonation']
  const personalPlatforms = Object.values(PERSONAL_PLATFORM_SLUGS)
  const systemPlatforms = Object.values(SYSTEM_PLATFORM_SLUGS)
  return normalizedPlatforms.includes(platform.toLowerCase()) || 
         personalPlatforms.includes(platform) || 
         systemPlatforms.includes(platform)
}

function normalizePlatformSlug(platform: string): string {
  const lower = platform.toLowerCase()
  if (lower === 'poweredbydonation') {
    return 'PoweredByDonation'
  }
  return platform
}

// Dynamic import for Services component
const ServicesPage = () => import('../../../../components/ServicesPageContent').then(m => m.default)

export default async function EntityBrowsePage({ 
  params,
  searchParams 
}: EntityBrowsePageProps) {
  try {
    const { locale, platform: platformStr, entity_type: entitySlug } = params

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

      
      // Import the services page content dynamically
      const ServicesPageContent = await ServicesPage()
      
      return (
        <Suspense fallback={<div>Loading services...</div>}>
          <ServicesPageContent 
            params={{ locale, services: entitySlug }}
          />
        </Suspense>
      )
    }

    // Handle personal platform sections
    if (isPersonalPlatform(normalizedPlatform)) {
      if (!PERSONAL_ENTITY_TYPES.includes(entityType)) {
        notFound()
      }

      // Use the unified personal dashboard component
      const PersonalDashboard = await import('../../../../components/personal/PersonalDashboard').then(m => m.default)
      
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <PersonalDashboard params={{ locale }} activeSection={entityType} />
        </Suspense>
      )
    }

    // Handle system platform sections
    if (isSystemPlatform(normalizedPlatform)) {
      if (!SYSTEM_ENTITY_TYPES.includes(entityType)) {
        notFound()
      }

      // Handle different system components with their specific props
      switch (entityType) {
        case 'donation-success':
          const DonationSuccessComponent = await import('../../../../components/system/SystemDonationSuccess').then(m => m.default)
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <DonationSuccessComponent 
                params={{ locale }} 
                searchParams={{ jgDonationId: searchParams.jgDonationId }} 
              />
            </Suspense>
          )
        case 'login':
          const LoginComponent = await import('../../../../components/system/SystemLogin').then(m => m.default)
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <LoginComponent params={{ locale }} />
            </Suspense>
          )
        case 'signup':
          const SignupComponent = await import('../../../../components/system/SystemSignup').then(m => m.default)
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <SignupComponent params={{ locale }} />
            </Suspense>
          )
        default:
          notFound()
      }
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
    console.error('EntityBrowsePage error:', error)
    // Return a fallback error page instead of throwing
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">We&apos;re having trouble loading this page. Please try again later.</p>
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
export async function generateMetadata({ params }: EntityBrowsePageProps) {
  const { platform: platformStr, entity_type: entitySlug } = params
  
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
        title: 'Services Not Found',
      }
    }

    return {
      title: 'Services - Powered by Donation',
      description: 'Browse professional services and support charities through skill-based donations.',
    }
  }

  // Handle personal platform sections
  if (isPersonalPlatform(normalizedPlatform)) {
    if (!PERSONAL_ENTITY_TYPES.includes(entityType)) {
      return {
        title: 'Section Not Found',
      }
    }

    const sectionTitles: Record<string, string> = {
      services: 'My Services',
      donations: 'My Donations',
      profile: 'My Profile',
      settings: 'My Settings',
      service_requests: 'My Service Requests'
    }

    return {
      title: `${sectionTitles[entityType] || 'My Dashboard'} - Powered by Donation`,
      description: `Manage your ${entityType} on Powered by Donation.`,
    }
  }

  // Handle system platform sections
  if (isSystemPlatform(normalizedPlatform)) {
    if (!SYSTEM_ENTITY_TYPES.includes(entityType)) {
      return {
        title: 'Page Not Found',
      }
    }

    const systemTitles: Record<string, string> = {
      'donation-success': 'Donation Successful',
      'login': 'Login',
      'signup': 'Sign Up'
    }

    return {
      title: `${systemTitles[entityType] || 'System Page'} - Powered by Donation`,
      description: `${systemTitles[entityType]} page for Powered by Donation.`,
    }
  }

  // Handle donation platforms
  if (!isValidPlatform(normalizedPlatform)) {
    return {
      title: 'Organizations Not Found',
    }
  }

  const platform = normalizedPlatform as DonationPlatform
  
  if (getPlatformEntityType(platform) !== entityType) {
    return {
      title: 'Organizations Not Found',
    }
  }

  const platformNames = {
    justgiving: 'JustGiving',
    everyorg: 'Every.org',
    acnc: 'ACNC'
  }

  const entityNames: Record<string, string> = {
    charities: 'Charities',
    nonprofits: 'Nonprofits',
    services: 'Services'
  }

  return {
    title: `Browse ${platformNames[platform]} ${entityNames[entityType] || 'Organizations'} - Powered by Donation`,
    description: `Discover ${platformNames[platform]} ${(entityNames[entityType] || 'organizations').toLowerCase()} and support causes through skill-based donations.`,
  }
}