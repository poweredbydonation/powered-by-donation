/**
 * Platform Home Page - Dynamic Route
 * Handles: /{locale}/justgiving/ and /{locale}/everyorg/
 */

import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { DonationPlatform } from '@/types/database'
import PlatformHome from '@/components/PlatformHome'

interface PlatformPageProps {
  params: {
    locale: string
    platform: string
  }
}

// Validate platform parameter
function isValidPlatform(platform: string): platform is DonationPlatform {
  return ['justgiving', 'everyorg'].includes(platform)
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { locale, platform: platformStr } = params

  // Validate platform
  if (!isValidPlatform(platformStr)) {
    notFound()
  }

  const platform = platformStr as DonationPlatform
  const messages = await getMessages({ locale })

  return <PlatformHome locale={locale} platform={platform} messages={messages} />
}

// Generate static params for known platforms
export function generateStaticParams() {
  const platforms: DonationPlatform[] = ['justgiving', 'everyorg']
  
  return platforms.map((platform) => ({
    platform,
  }))
}

// Generate metadata
export async function generateMetadata({ params }: PlatformPageProps) {
  const { locale, platform: platformStr } = params
  
  if (!isValidPlatform(platformStr)) {
    return {
      title: 'Platform Not Found',
    }
  }

  const platform = platformStr as DonationPlatform
  const platformNames = {
    justgiving: 'JustGiving',
    everyorg: 'Every.org'
  }

  return {
    title: `${platformNames[platform]} - Powered by Donation`,
    description: `Browse ${platformNames[platform]} organizations and support causes through skill-based donations.`,
  }
}