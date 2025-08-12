/**
 * Platform Translation Utilities
 * Provides localized platform-specific terminology and metadata
 */

import { DonationPlatform } from '@/types/database'

/**
 * Get localized entity type for a platform
 * @param platform - The donation platform
 * @param plural - Whether to return plural form
 * @param messages - Translations object from useTranslations()
 * @returns Localized entity type (e.g., "charity" vs "nonprofit")
 */
export function getPlatformEntityType(
  platform: DonationPlatform, 
  plural: boolean = false,
  messages: any
): string {
  const entityKey = plural ? 'plural' : 'singular'
  
  try {
    return messages.platforms?.[platform]?.entityType?.[entityKey] || 
           (plural ? (platform === 'justgiving' ? 'charities' : 'nonprofits') 
                   : (platform === 'justgiving' ? 'charity' : 'nonprofit'))
  } catch (error) {
    // Fallback to English
    return plural ? (platform === 'justgiving' ? 'charities' : 'nonprofits') 
                  : (platform === 'justgiving' ? 'charity' : 'nonprofit')
  }
}

/**
 * Get localized platform name
 * @param platform - The donation platform
 * @param messages - Translations object from useTranslations()
 * @returns Localized platform name (e.g., "JustGiving", "Every.org")
 */
export function getPlatformName(platform: DonationPlatform, messages: any): string {
  try {
    return messages.platforms?.[platform]?.name || 
           (platform === 'justgiving' ? 'JustGiving' : 'Every.org')
  } catch (error) {
    // Fallback to English
    return platform === 'justgiving' ? 'JustGiving' : 'Every.org'
  }
}

/**
 * Get localized browse page title for a platform
 * @param platform - The donation platform
 * @param messages - Translations object from useTranslations()
 * @returns Localized browse page title
 */
export function getPlatformBrowseTitle(platform: DonationPlatform, messages: any): string {
  try {
    return messages.platforms?.[platform]?.browse?.title || 
           `Browse ${getPlatformName(platform, messages)} ${getPlatformEntityType(platform, true, messages)}`
  } catch (error) {
    // Fallback to English
    const name = platform === 'justgiving' ? 'JustGiving' : 'Every.org'
    const entities = platform === 'justgiving' ? 'Charities' : 'Nonprofits'
    return `Browse ${name} ${entities}`
  }
}

/**
 * Get localized browse page description for a platform
 * @param platform - The donation platform
 * @param messages - Translations object from useTranslations()
 * @returns Localized browse page description
 */
export function getPlatformBrowseDescription(platform: DonationPlatform, messages: any): string {
  try {
    return messages.platforms?.[platform]?.browse?.description || 
           `Discover ${getPlatformEntityType(platform, true, messages)} and support causes through skill-based donations.`
  } catch (error) {
    // Fallback to English
    const entities = platform === 'justgiving' ? 'registered UK charities' : 'nonprofits'
    return `Discover ${entities} and support causes through skill-based donations.`
  }
}

/**
 * Get platform-specific styling classes
 * @param platform - The donation platform
 * @returns CSS classes for platform branding
 */
export function getPlatformStyles(platform: DonationPlatform): {
  primary: string
  secondary: string
  badge: string
  button: string
} {
  if (platform === 'justgiving') {
    return {
      primary: 'text-blue-600',
      secondary: 'text-blue-700', 
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  } else {
    return {
      primary: 'text-green-600',
      secondary: 'text-green-700',
      badge: 'bg-green-100 text-green-800', 
      button: 'bg-green-600 hover:bg-green-700 text-white'
    }
  }
}