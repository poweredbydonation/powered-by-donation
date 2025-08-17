/**
 * Entity Type URL Mappings for Platform-First Architecture
 * 
 * Maps localized, transliterated URL slugs to entity types and vice versa.
 * All URL slugs use English alphabet for browser compatibility.
 */

import { DonationPlatform } from '@/types/database'

// Entity types (canonical values)
export type EntityType = 'charities' | 'nonprofits'

// Platform to entity type mapping
export const PLATFORM_ENTITY_TYPES: Record<DonationPlatform, EntityType> = {
  justgiving: 'charities',
  everyorg: 'nonprofits',
  acnc: 'charities'
}

// Transliterated URL slugs for each entity type by locale
export const ENTITY_URL_SLUGS: Record<EntityType, Record<string, string>> = {
  charities: {
    en: 'charities',
    de: 'wohltatigkeitsorganisationen', 
    es: 'organizaciones-beneficas',
    fr: 'organisations-caritatives',
    it: 'organizzazioni-benefiche',
    pt: 'organizacoes-de-caridade',
    ja: 'jizen-dantai',
    ko: 'jasan-danche',
    zh: 'cisharn-zuzhi',
    ar: 'munazzamat-khayriyya',
    hi: 'daanveer-sangathan',
    tr: 'bagis-kuruluslari',
    tl: 'mga-charity',
    el: 'filanthropikes-organoseis',
    yue: 'ji-sin-zou-jik',
    pa: 'daan-sanstha',
    vi: 'to-chuc-tu-thien'
  },
  nonprofits: {
    en: 'nonprofits',
    de: 'gemeinnuetzige-organisationen',
    es: 'organizaciones-sin-fines-de-lucro', 
    fr: 'organisations-a-but-non-lucratif',
    it: 'organizzazioni-no-profit',
    pt: 'organizacoes-sem-fins-lucrativos',
    ja: 'hi-eiri-dantai',
    ko: 'biryeongli-danche',
    zh: 'feiyingli-zuzhi',
    ar: 'munazzamat-ghayr-ribhiyya',
    hi: 'gair-labhakaari-sangathan',
    tr: 'kar-amaci-gutmeyen-kuruluslar',
    tl: 'mga-nonprofit',
    el: 'mi-kerdoskopiikes-organoseis',
    yue: 'fei-ying-lei-zou-jik',
    pa: 'gair-munafa-sanstha',
    vi: 'to-chuc-phi-loi-nhuan'
  }
}

// Reverse mapping: URL slug to entity type
const SLUG_TO_ENTITY: Record<string, EntityType> = {}
Object.entries(ENTITY_URL_SLUGS).forEach(([entityType, localeMap]) => {
  Object.values(localeMap).forEach(slug => {
    SLUG_TO_ENTITY[slug] = entityType as EntityType
  })
})

/**
 * Get the URL slug for an entity type in a specific locale
 */
export function getEntityUrlSlug(entityType: EntityType, locale: string): string {
  return ENTITY_URL_SLUGS[entityType]?.[locale] || ENTITY_URL_SLUGS[entityType]?.['en'] || entityType
}

/**
 * Get the entity type from a URL slug
 */
export function getEntityTypeFromSlug(slug: string): EntityType | null {
  return SLUG_TO_ENTITY[slug] || null
}

/**
 * Get the entity type for a platform
 */
export function getPlatformEntityType(platform: DonationPlatform): EntityType {
  return PLATFORM_ENTITY_TYPES[platform]
}

/**
 * Get the URL slug for a platform in a specific locale
 */
export function getPlatformEntitySlug(platform: DonationPlatform, locale: string): string {
  const entityType = getPlatformEntityType(platform)
  return getEntityUrlSlug(entityType, locale)
}

/**
 * Build platform-first URL
 */
export function buildPlatformUrl(locale: string, platform: DonationPlatform, slug?: string): string {
  const entitySlug = getPlatformEntitySlug(platform, locale)
  const basePath = `/${locale}/${platform}/${entitySlug}`
  return slug ? `${basePath}/${slug}` : basePath
}

/**
 * Parse platform URL and extract components
 */
export interface ParsedPlatformUrl {
  locale: string
  platform: DonationPlatform
  entityType: EntityType
  organizationSlug?: string
}

export function parsePlatformUrl(pathname: string): ParsedPlatformUrl | null {
  // Expected format: /[locale]/[platform]/[entity_slug]/[org_slug?]
  const parts = pathname.split('/').filter(Boolean)
  
  if (parts.length < 3) return null
  
  const [locale, platformStr, entitySlug, organizationSlug] = parts
  
  // Validate platform
  if (!['justgiving', 'everyorg', 'acnc'].includes(platformStr)) return null
  const platform = platformStr as DonationPlatform
  
  // Get entity type from slug
  const entityType = getEntityTypeFromSlug(entitySlug)
  if (!entityType) return null
  
  // Validate platform-entity consistency
  if (getPlatformEntityType(platform) !== entityType) return null
  
  return {
    locale,
    platform,
    entityType,
    organizationSlug
  }
}

/**
 * Get all possible URL slugs for an entity type (for route matching)
 */
export function getAllEntitySlugs(entityType: EntityType): string[] {
  return Object.values(ENTITY_URL_SLUGS[entityType])
}

/**
 * Validate if a URL slug is valid for an entity type
 */
export function isValidEntitySlug(slug: string, entityType: EntityType): boolean {
  return getAllEntitySlugs(entityType).includes(slug)
}