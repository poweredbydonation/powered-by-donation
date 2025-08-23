/**
 * Entity Type URL Mappings for Platform-First Architecture
 * 
 * Maps localized, transliterated URL slugs to entity types and vice versa.
 * All URL slugs use English alphabet for browser compatibility.
 */

import { DonationPlatform } from '@/types/database'

// Entity types (canonical values)
export type EntityType = 'charities' | 'nonprofits' | 'services' | 'donations' | 'profile' | 'settings' | 'donation-success' | 'login' | 'signup'

// Platform to entity type mapping
export const PLATFORM_ENTITY_TYPES: Record<DonationPlatform, EntityType> = {
  justgiving: 'charities',
  everyorg: 'nonprofits',
  acnc: 'charities'
}

// PoweredByDonation platform entity type
export const POWERED_BY_DONATION_ENTITY_TYPE: EntityType = 'services'

// Personal platform slugs by locale
export const PERSONAL_PLATFORM_SLUGS: Record<string, string> = {
  en: 'my',
  de: 'mein', 
  es: 'mi',
  fr: 'mon',
  it: 'mio',
  pt: 'meu',
  ja: 'watashi-no',
  ko: 'nae',
  zh: 'wo-de',
  ar: 'milki',
  hi: 'mera',
  tr: 'benim',
  tl: 'aking',
  el: 'mou',
  yue: 'ngo-ge',
  pa: 'mera',
  vi: 'cua-toi'
}

// Personal platform entity types (for dashboard sections)
export const PERSONAL_ENTITY_TYPES: EntityType[] = ['services', 'donations', 'profile', 'settings']

// System entity types (for general app pages)
export const SYSTEM_ENTITY_TYPES: EntityType[] = ['donation-success', 'login', 'signup']

// System platform slug (consistent across languages)
export const SYSTEM_PLATFORM_SLUG = 'system'

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
  },
  services: {
    en: 'services',
    de: 'dienstleistungen',
    es: 'servicios',
    fr: 'services',
    it: 'servizi',
    pt: 'servicos',
    ja: 'sabisu',
    ko: 'seobiseu',
    zh: 'fuwu',
    ar: 'khadamat',
    hi: 'seva',
    tr: 'hizmetler',
    tl: 'mga-serbisyo',
    el: 'ypiresies',
    yue: 'fuk-mou',
    pa: 'sewa',
    vi: 'dich-vu'
  },
  donations: {
    en: 'donations',
    de: 'spenden',
    es: 'donaciones',
    fr: 'dons',
    it: 'donazioni',
    pt: 'doacoes',
    ja: 'kifu',
    ko: 'gibus',
    zh: 'juanzeng',
    ar: 'tabarruaat',
    hi: 'daan',
    tr: 'bagislarim',
    tl: 'mga-donasyon',
    el: 'doreai',
    yue: 'kyun-jing',
    pa: 'daan',
    vi: 'quy-gop'
  },
  profile: {
    en: 'profile',
    de: 'profil',
    es: 'perfil',
    fr: 'profil',
    it: 'profilo',
    pt: 'perfil',
    ja: 'purofiiru',
    ko: 'peulopil',
    zh: 'ziliao',
    ar: 'malaf-shakhi',
    hi: 'praphi',
    tr: 'profil',
    tl: 'profile',
    el: 'profil',
    yue: 'go-jan-ji-liu',
    pa: 'profail',
    vi: 'ho-so'
  },
  settings: {
    en: 'settings',
    de: 'einstellungen',
    es: 'configuracion',
    fr: 'parametres',
    it: 'impostazioni',
    pt: 'configuracoes',
    ja: 'settingu',
    ko: 'seoljeong',
    zh: 'shezhi',
    ar: 'aedadat',
    hi: 'settingz',
    tr: 'ayarlar',
    tl: 'mga-setting',
    el: 'rythmiseis',
    yue: 'sit-jing',
    pa: 'settingan',
    vi: 'cai-dat'
  },
  'donation-success': {
    en: 'donation-success',
    de: 'spenden-erfolg',
    es: 'donacion-exitosa',
    fr: 'don-reussi',
    it: 'donazione-riuscita',
    pt: 'doacao-sucesso',
    ja: 'kifu-seiko',
    ko: 'gibus-seonggong',
    zh: 'juanzeng-chenggong',
    ar: 'tabarru-najah',
    hi: 'daan-safalta',
    tr: 'bagis-basarili',
    tl: 'donasyon-matagumpay',
    el: 'dorea-epitychis',
    yue: 'kyun-jing-sing-gung',
    pa: 'daan-safalta',
    vi: 'quy-gop-thanh-cong'
  },
  login: {
    en: 'login',
    de: 'anmelden',
    es: 'iniciar-sesion',
    fr: 'connexion',
    it: 'accedi',
    pt: 'entrar',
    ja: 'roguin',
    ko: 'rogeugin',
    zh: 'denglu',
    ar: 'dukhuul',
    hi: 'login',
    tr: 'giris',
    tl: 'mag-login',
    el: 'syndesi',
    yue: 'dang-luk',
    pa: 'login',
    vi: 'dang-nhap'
  },
  signup: {
    en: 'signup',
    de: 'registrieren',
    es: 'registrarse',
    fr: 'inscription',
    it: 'registrati',
    pt: 'cadastrar',
    ja: 'tooloo',
    ko: 'hoewongatib',
    zh: 'zhuce',
    ar: 'tasjeel',
    hi: 'signup',
    tr: 'kayit-ol',
    tl: 'mag-signup',
    el: 'eggrafi',
    yue: 'ji-chaak',
    pa: 'signup',
    vi: 'dang-ky'
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
  
  // Handle PoweredByDonation platform
  if (platformStr === 'PoweredByDonation') {
    const entityType = getEntityTypeFromSlug(entitySlug)
    if (entityType !== 'services') return null
    
    return {
      locale,
      platform: 'PoweredByDonation' as any, // Special case
      entityType,
      organizationSlug
    }
  }
  
  // Validate donation platform
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

/**
 * Get the personal platform slug for a locale
 */
export function getPersonalPlatformSlug(locale: string): string {
  return PERSONAL_PLATFORM_SLUGS[locale] || PERSONAL_PLATFORM_SLUGS['en']
}

/**
 * Check if a platform slug is a personal platform
 */
export function isPersonalPlatform(platformSlug: string): boolean {
  return Object.values(PERSONAL_PLATFORM_SLUGS).includes(platformSlug)
}

/**
 * Check if a platform slug is the system platform
 */
export function isSystemPlatform(platformSlug: string): boolean {
  return platformSlug === SYSTEM_PLATFORM_SLUG
}

/**
 * Build personal platform URL
 */
export function buildPersonalUrl(locale: string, entityType: EntityType, subPath?: string): string {
  const personalPlatform = getPersonalPlatformSlug(locale)
  const entitySlug = getEntityUrlSlug(entityType, locale)
  const basePath = `/${locale}/${personalPlatform}/${entitySlug}`
  return subPath ? `${basePath}${subPath}` : basePath
}

/**
 * Build system platform URL
 */
export function buildSystemUrl(locale: string, entityType: EntityType, subPath?: string): string {
  const entitySlug = getEntityUrlSlug(entityType, locale)
  const basePath = `/${locale}/${SYSTEM_PLATFORM_SLUG}/${entitySlug}`
  return subPath ? `${basePath}${subPath}` : basePath
}

/**
 * Parse personal platform URL and extract components
 */
export interface ParsedPersonalUrl {
  locale: string
  personalPlatform: string
  entityType: EntityType
  subPath?: string
}

export function parsePersonalUrl(pathname: string): ParsedPersonalUrl | null {
  // Expected format: /[locale]/[personal_platform]/[entity_slug]/[sub_path?]
  const parts = pathname.split('/').filter(Boolean)
  
  if (parts.length < 3) return null
  
  const [locale, personalPlatformSlug, entitySlug, ...subPathParts] = parts
  
  // Validate personal platform
  if (!isPersonalPlatform(personalPlatformSlug)) return null
  
  // Get entity type from slug
  const entityType = getEntityTypeFromSlug(entitySlug)
  if (!entityType) return null
  
  // Validate it's a personal entity type
  if (!PERSONAL_ENTITY_TYPES.includes(entityType)) return null
  
  return {
    locale,
    personalPlatform: personalPlatformSlug,
    entityType,
    subPath: subPathParts.length > 0 ? `/${subPathParts.join('/')}` : undefined
  }
}