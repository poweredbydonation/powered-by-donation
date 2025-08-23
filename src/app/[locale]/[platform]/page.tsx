/**
 * Platform Home Page - Dynamic Route
 * Handles: /{locale}/justgiving/, /{locale}/everyorg/, /{locale}/acnc/, and /{locale}/PoweredByDonation/
 */

import { notFound, redirect } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { DonationPlatform } from '@/types/database'
import { PERSONAL_PLATFORM_SLUGS, isPersonalPlatform, getEntityUrlSlug } from '@/lib/utils/entity-urls'
import PlatformHome from '@/components/PlatformHome'

interface PlatformPageProps {
  params: {
    locale: string
    platform: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg', 'acnc'].includes(platform)
}

function isValidPlatformSlug(platform: string): boolean {
  const normalizedPlatforms = ['justgiving', 'everyorg', 'acnc', 'poweredbydonation']
  const personalPlatforms = Object.values(PERSONAL_PLATFORM_SLUGS)
  return normalizedPlatforms.includes(platform.toLowerCase()) || personalPlatforms.includes(platform)
}

function normalizePlatformSlug(platform: string): string {
  const lower = platform.toLowerCase()
  if (lower === 'poweredbydonation') {
    return 'PoweredByDonation'
  }
  return platform
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { locale, platform: platformStr } = params

  // Validate platform slug
  if (!isValidPlatformSlug(platformStr)) {
    notFound()
  }

  // Normalize platform slug
  const normalizedPlatform = normalizePlatformSlug(platformStr)

  // Handle PoweredByDonation platform redirect to services
  if (normalizedPlatform === 'PoweredByDonation') {
    const servicesSlug = locale === 'tr' ? 'hizmetler' : 'services'
    redirect(`/${locale}/PoweredByDonation/${servicesSlug}`)
  }

  // Handle personal platform redirect to services (default personal section)
  if (isPersonalPlatform(normalizedPlatform)) {
    const servicesSlug = getEntityUrlSlug('services', locale)
    redirect(`/${locale}/${normalizedPlatform}/${servicesSlug}`)
  }

  // Validate donation platform
  if (!isValidPlatform(normalizedPlatform)) {
    notFound()
  }

  const platform = normalizedPlatform as DonationPlatform
  const messages = await getMessages({ locale })

  return <PlatformHome locale={locale} platform={platform} messages={messages} />
}

// Generate static params for known platforms
export function generateStaticParams() {
  const allPlatforms = ['justgiving', 'everyorg', 'acnc', 'PoweredByDonation']
  
  return allPlatforms.map((platform) => ({
    platform,
  }))
}

// Generate metadata
export async function generateMetadata({ params }: PlatformPageProps) {
  const { locale, platform: platformStr } = params
  
  if (!isValidPlatformSlug(platformStr)) {
    return {
      title: 'Platform Not Found',
    }
  }

  // Normalize platform slug
  const normalizedPlatform = normalizePlatformSlug(platformStr)

  if (normalizedPlatform === 'PoweredByDonation') {
    return {
      title: 'Services - Powered by Donation',
      description: 'Browse professional services and support charities through skill-based donations.',
    }
  }

  if (isPersonalPlatform(normalizedPlatform)) {
    return {
      title: 'My Dashboard - Powered by Donation',
      description: 'Manage your services, donations, and profile on Powered by Donation.',
    }
  }

  const platform = normalizedPlatform as DonationPlatform
  const platformNames = {
    justgiving: 'JustGiving',
    everyorg: 'Every.org',
    acnc: 'ACNC'
  }

  return {
    title: `${platformNames[platform]} - Powered by Donation`,
    description: `Browse ${platformNames[platform]} organizations and support causes through skill-based donations.`,
  }
}